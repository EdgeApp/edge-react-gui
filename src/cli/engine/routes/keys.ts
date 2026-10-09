import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import type { EdgeAccount, EdgeWalletStates } from 'edge-core-js'

import { doc } from '../doc'
import { WALLET_ERRORS } from '../errorGroups'
import { engineError, errorMessage } from '../errors'
import { findWalletId } from '../resolve'
import { route } from '../route'
import type { RouteContext } from '../router'
import {
  asCoreValue,
  asWalletId,
  asWalletKeys,
  withoutUndefined
} from '../schemas'
import { getAccount } from './helpers'

/**
 * The full wallet id behind a `walletId` query field.
 *
 * These routes hand the id straight to core, which only knows full ids. The
 * documented contract is that any unique prefix works, so resolve it here
 * rather than making these five calls the exceptions.
 */
function walletIdFor(
  ctx: RouteContext & {
    query: { valid: { walletId: string } }
  }
): string {
  return findWalletId(getAccount(ctx), ctx.query.valid.walletId)
}

const asWalletIdQuery = asObject({ walletId: asWalletId }).withRest

/**
 * List every key in the account.
 *
 * Includes archived and deleted keys, unlike `currency-wallets`.
 */
export const allKeys = route({
  core: 'account.allKeys',
  method: 'GET',
  path: '/account/{sessionId}/all-keys',
  cli: 'all-keys',
  returns: asObject({
    allKeys: doc(
      asArray(asCoreValue),
      '`EdgeWalletInfoFull[]`: id, type, keys, archived, deleted, hidden, sortIndex.'
    )
  }),

  handler(ctx) {
    return { allKeys: getAccount(ctx).allKeys }
  }
})

/**
 * Create a wallet from raw key JSON.
 *
 * The import path. Use `create-currency-wallet` to make a fresh wallet with
 * generated keys.
 */
export const createWallet = route({
  core: 'account.createWallet',
  method: 'POST',
  path: '/account/{sessionId}/create-wallet',
  cli: 'create-wallet',
  body: asObject({
    type: doc(asString, 'Wallet type, e.g. `wallet:bitcoin`.'),
    keys: asOptional(
      doc(asWalletKeys, 'Plugin key material. Omit to let core generate it.')
    )
  }).withRest,
  returns: asObject({
    walletId: doc(asString, 'The new wallet. Its keys are already saved.')
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const walletId = await getAccount(ctx).createWallet(
      ctx.body.type,
      ctx.body.keys
    )
    return { walletId }
  }
})

/**
 * Read one wallet's key info.
 *
 * @note An exact lookup: unlike the wallet-scoped routes this does not accept
 *   an id prefix.
 */
export const getWalletInfo = route({
  core: 'account.getWalletInfo',
  method: 'GET',
  path: '/account/{sessionId}/get-wallet-info',
  cli: 'get-wallet-info',
  query: asObject({
    id: doc(asString, 'The key id, from `all-keys`. Base64, like a wallet id.')
  }).withRest,
  returns: doc(
    asCoreValue,
    '`EdgeWalletInfoFull`, verbatim from core — including the `keys` object.'
  ),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  handler(ctx) {
    const info = getAccount(ctx).getWalletInfo(ctx.query.valid.id)
    if (info == null) {
      throw engineError(
        'WALLET_NOT_FOUND',
        `No wallet found matching: ${ctx.query.valid.id}`,
        404
      )
    }
    return info
  }
})

/**
 * Read raw private key material.
 *
 * Secret. Whatever the plugin stores — seed, mnemonic, xpriv.
 */
export const getRawPrivateKey = route({
  core: 'account.getRawPrivateKey',
  method: 'GET',
  path: '/account/{sessionId}/get-raw-private-key',
  cli: 'get-raw-private-key',
  query: asWalletIdQuery,
  returns: doc(asCoreValue, 'The plugin’s key object, at the top level.'),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const account = getAccount(ctx)
    return await account.getRawPrivateKey(walletIdFor(ctx))
  }
})

/**
 * Read raw public key material.
 */
export const getRawPublicKey = route({
  core: 'account.getRawPublicKey',
  method: 'GET',
  path: '/account/{sessionId}/get-raw-public-key',
  cli: 'get-raw-public-key',
  query: asWalletIdQuery,
  returns: doc(asCoreValue, 'The plugin’s public key object.'),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const account = getAccount(ctx)
    return await account.getRawPublicKey(walletIdFor(ctx))
  }
})

/**
 * A display key, with "the wallet is not running" told apart from a fault.
 *
 * The display form is the plugin's own: core asks the currency tools for it,
 * and for a plugin whose tools do not implement it falls back to
 * `waitForCurrencyEngine`, which needs a *running* engine. Core builds those
 * from `activeWalletIds`, so on an archived or otherwise unloaded wallet that
 * fallback throws a plain `Error` — `Wallet id … does not exist in this
 * account` — which this engine reported as `500 INTERNAL_ERROR` for a
 * knowable condition, on a route whose own resolver had just found the wallet
 * in `allKeys` and whose caller is usually recovering keys.
 *
 * The raw forms have no such limit, which is why only these two need it, and
 * a plugin that does implement the tools call still answers while archived —
 * so this cannot be a pre-check on `currencyWallets`. The call is tried, and
 * only a failure *plus* a wallet with no running engine becomes
 * `WALLET_NOT_RUNNING`.
 *
 * Exported for its test: whether an archived wallet still has a running
 * engine depends on how far core has got with tearing it down, so an
 * end-to-end check of this races.
 */
export async function displayKey(
  account: EdgeAccount,
  walletId: string,
  read: (walletId: string) => Promise<string>
): Promise<{ key: string }> {
  try {
    return { key: await read(walletId) }
  } catch (error: unknown) {
    if (account.currencyWallets[walletId] != null) throw error
    // The original message, kept. The guard narrows which *arm* this is, not
    // what went wrong inside it — a plugin that threw while deriving, a key
    // blob it could not read — and the substitution happens before the
    // request sink, so dropping the cause lost it from the engine log too.
    // These are the key-recovery routes: the caller is already in trouble.
    const cause = errorMessage(error)
    throw engineError(
      'WALLET_NOT_RUNNING',
      `Wallet ${walletId} has no running engine, and this currency's plugin ` +
        'can only produce a display key from one. Unarchive or unpause the ' +
        'wallet, or read the raw key with get-raw-private-key. The plugin ' +
        `said: ${cause}`,
      409
    )
  }
}

/**
 * Export the private key for display.
 *
 * Secret. The human-facing form — WIF, seed phrase, whatever the plugin shows
 * on its export screen.
 */
export const getDisplayPrivateKey = route({
  core: 'account.getDisplayPrivateKey',
  method: 'GET',
  path: '/account/{sessionId}/get-display-private-key',
  cli: 'get-display-private-key',
  query: asWalletIdQuery,
  returns: asObject({ key: doc(asString, 'The displayable private key.') }),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID', 'WALLET_NOT_RUNNING'],

  async handler(ctx) {
    const account = getAccount(ctx)
    return await displayKey(
      account,
      walletIdFor(ctx),
      async walletId => await account.getDisplayPrivateKey(walletId)
    )
  }
})

/**
 * Export the public key for display.
 *
 * The xpub or equivalent — safe to share for watch-only use.
 */
export const getDisplayPublicKey = route({
  core: 'account.getDisplayPublicKey',
  method: 'GET',
  path: '/account/{sessionId}/get-display-public-key',
  cli: 'get-display-public-key',
  query: asWalletIdQuery,
  returns: asObject({ key: doc(asString, 'The displayable public key.') }),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID', 'WALLET_NOT_RUNNING'],

  async handler(ctx) {
    const account = getAccount(ctx)
    return await displayKey(
      account,
      walletIdFor(ctx),
      async walletId => await account.getDisplayPublicKey(walletId)
    )
  }
})

/**
 * List chains a wallet can split into.
 *
 * Forked-chain support: which wallet types can be derived from these keys.
 */
export const listSplittableWalletTypes = route({
  core: 'account.listSplittableWalletTypes',
  method: 'GET',
  path: '/account/{sessionId}/list-splittable-wallet-types',
  cli: 'list-splittable-wallet-types',
  query: asWalletIdQuery,
  returns: asObject({
    walletTypes: doc(asArray(asString), 'Types valid for `split`.')
  }),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const walletTypes = await getAccount(ctx).listSplittableWalletTypes(
      walletIdFor(ctx)
    )
    return { walletTypes }
  }
})

/**
 * `EdgeWalletState`, declared rather than restated.
 *
 * All five fields core carries. `migratedFromWalletId` was the one left out,
 * and because the object is `.withRest` a caller could still send it: a
 * wrong-typed one went through `account.changeWalletStates` into
 * `asWalletStateFile`'s uncleaner, which threw inside core — a `500
 * INTERNAL_ERROR` on a route whose declared errors are `BAD_REQUEST` plus
 * the wallet ones, where the declaration should have answered a 400 naming
 * the field. `.withRest` stays, so an unrecognised key is visible to
 * `onlyNamedFlags` and refused rather than silently dropped.
 *
 * Exported for the test, which kept its own copy of these four fields and
 * so could not notice the fifth going missing.
 */
export const asWalletStateEntry = asObject({
  archived: asOptional(asBoolean),
  deleted: asOptional(asBoolean),
  hidden: asOptional(asBoolean),
  migratedFromWalletId: asOptional(asString),
  sortIndex: asOptional(asNumber)
}).withRest

/** The keys that cleaner names, so the two cannot drift. */
const WALLET_STATE_FLAGS = [
  'archived',
  'deleted',
  'hidden',
  'migratedFromWalletId',
  'sortIndex'
]

/**
 * The flags the caller actually named, with the absent ones removed.
 *
 * `asObject` materialises every declared key, so cleaning
 * `{"archived": true}` yields an object that *has* `deleted`, `hidden` and
 * `sortIndex` — each `undefined`. Core merges rather than replaces:
 * `toWrite[id] = { ...walletStates[id], ...newStates[id] }`
 * (`account-files.js:257`), and an object spread copies a key whose value is
 * `undefined` over the real one. So archiving a wallet also cleared its
 * `hidden` flag and its `sortIndex`, in the account's *synced*
 * `Keys/<hash>.json`, and that reached every device the account has.
 *
 * `JSON.stringify` hides it — the cleaned value prints as `{"archived":true}`
 * — and the `as unknown as` cast the fix replaces is what kept the compiler
 * from mentioning the extra keys. A caller cannot send `archived: undefined`
 * over JSON, so "the key is present and undefined" means exactly "the caller
 * did not name it".
 *
 * A flag the caller misspelled is refused rather than forwarded. The inner
 * cleaner is `.withRest`, so `{"archvied": true}` survives cleaning and core
 * writes it verbatim into the same synced file — the request answered `204`,
 * nothing was archived, and the account carried a junk key to every device.
 * Dropping `.withRest` would silently ignore it instead, which is the
 * "answered 204 while nothing changed" failure the handler below says it
 * fixed for wallet ids; this is the same answer for flags.
 *
 * Exported for its test: the destruction is in the account's synced repo and
 * `JSON.stringify` cannot see it.
 */
export function onlyNamedFlags(
  states: ReturnType<typeof asWalletStateEntry>
): EdgeWalletStates[string] {
  const unknown = Object.keys(states).filter(
    key => !WALLET_STATE_FLAGS.includes(key)
  )
  if (unknown.length > 0) {
    throw engineError(
      'BAD_REQUEST',
      `Unknown wallet state flag${unknown.length > 1 ? 's' : ''} ${unknown
        .map(key => `"${key}"`)
        .join(', ')}; expected ${WALLET_STATE_FLAGS.join(', ')}`,
      400
    )
  }
  return withoutUndefined(states)
}

/**
 * Archive, delete, hide, or reorder wallets.
 *
 * The canonical backend for every wallet flag; there are no separate archive,
 * unarchive or undelete verbs.
 */
export const changeWalletStates = route({
  core: 'account.changeWalletStates',
  method: 'POST',
  path: '/account/{sessionId}/change-wallet-states',
  cli: {
    command: 'change-wallet-states',
    custom: true,
    extra: {
      walletId: {
        kind: 'string',
        required: true,
        doc: 'The wallet to change. The command makes it the key of a single-entry `walletStates` map.'
      },
      archived: { kind: 'boolstr', doc: 'Hide from the active list.' },
      deleted: { kind: 'boolstr', doc: 'Mark deleted.' },
      hidden: { kind: 'boolstr', doc: 'Hide from the wallet picker.' },
      sortIndex: { kind: 'string', doc: 'Position in the wallet list.' }
    },
    notes:
      'The command builds a single-wallet `walletStates` map from these flags, and needs at least one. `--wallet-states` is the other form: the whole `EdgeWalletStates` map as JSON, which is the only way to change several wallets in one call, and it cannot be combined with `--wallet-id`.',
    // Two mutually exclusive forms, which one argument per field cannot
    // say: the assembled line read as "pass `--wallet-states` *and*
    // `--wallet-id`", and the command refuses exactly that.
    usage:
      "change-wallet-states --wallet-id=<walletId> [--archived=true|false] [--deleted=true|false] [--hidden=true|false] [--sort-index=<sortIndex>] | change-wallet-states --wallet-states='<json>'"
  },
  body: asObject({
    walletStates: doc(
      asObject(asWalletStateEntry),
      '`EdgeWalletStates`: wallet ids to the flags being changed.'
    )
  }).withRest,
  // Every key goes through `findWalletId`, which is the whole point of the
  // route: an unknown id is a 404 and a prefix two wallets share is a 409.
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const account = getAccount(ctx)
    // Every key resolved first. Core treats an id it has never seen as new
    // and writes a state file for it without complaint, so a typo or a
    // prefix answered 204 while nothing changed — and left a bogus
    // `Keys/<hash>.json` record in the account repo to sync to every device.
    // This was also the one wallet route that did not honour the prefix
    // contract `walletId` is documented with everywhere else, so an id that
    // worked with `rename-wallet` silently did nothing here. Resolved over
    // `allKeys`, because archiving and deleting are exactly the states an
    // already-archived wallet has.
    const resolved: EdgeWalletStates = {}
    for (const [prefix, states] of Object.entries(ctx.body.walletStates)) {
      resolved[findWalletId(account, prefix)] = onlyNamedFlags(states)
    }
    await account.changeWalletStates(resolved)
    return undefined
  }
})
