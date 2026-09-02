import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import type { EdgeWalletStates } from 'edge-core-js'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asCoreValue } from '../schemas'
import { getAccount } from './helpers'

const WALLET_ID_QUERY_DOC = 'Full base58 wallet id.'

const asWalletIdQuery = asObject({
  walletId: doc(asString, WALLET_ID_QUERY_DOC)
}).withRest

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
  cli: { command: 'create-wallet', bodyFlag: 'key-info' },
  body: asObject({
    type: doc(asString, 'Wallet type, e.g. `wallet:bitcoin`.'),
    keys: asOptional(
      doc(asCoreValue, 'Plugin key material. Omit to let core generate it.')
    )
  }).withRest,
  returns: asObject({
    walletId: doc(asString, 'The new wallet. Its keys are already saved.')
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const keys =
      ctx.body.keys != null && typeof ctx.body.keys === 'object'
        ? (ctx.body.keys as Record<string, unknown>)
        : undefined
    const walletId = await getAccount(ctx).createWallet(ctx.body.type, keys)
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
  cli: { command: 'get-wallet-info', positional: 'id' },
  query: asObject({ id: doc(asString, WALLET_ID_QUERY_DOC) }).withRest,
  returns: doc(
    asCoreValue,
    '`EdgeWalletInfoFull`, verbatim from core — including the `keys` object.'
  ),
  errors: ['WALLET_NOT_FOUND'],

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
  cli: { command: 'get-raw-private-key', positional: 'walletId' },
  query: asWalletIdQuery,
  returns: doc(asCoreValue, "The plugin's key object, at the top level."),
  errors: ['WALLET_NOT_FOUND'],

  async handler(ctx) {
    return await getAccount(ctx).getRawPrivateKey(ctx.query.valid.walletId)
  }
})

/**
 * Read raw public key material.
 */
export const getRawPublicKey = route({
  core: 'account.getRawPublicKey',
  method: 'GET',
  path: '/account/{sessionId}/get-raw-public-key',
  cli: { command: 'get-raw-public-key', positional: 'walletId' },
  query: asWalletIdQuery,
  returns: doc(asCoreValue, "The plugin's public key object."),
  errors: ['WALLET_NOT_FOUND'],

  async handler(ctx) {
    return await getAccount(ctx).getRawPublicKey(ctx.query.valid.walletId)
  }
})

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
  cli: { command: 'get-display-private-key', positional: 'walletId' },
  query: asWalletIdQuery,
  returns: asObject({ key: doc(asString, 'The displayable private key.') }),
  errors: ['WALLET_NOT_FOUND'],

  async handler(ctx) {
    const key = await getAccount(ctx).getDisplayPrivateKey(
      ctx.query.valid.walletId
    )
    return { key }
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
  cli: { command: 'get-display-public-key', positional: 'walletId' },
  query: asWalletIdQuery,
  returns: asObject({ key: doc(asString, 'The displayable public key.') }),
  errors: ['WALLET_NOT_FOUND'],

  async handler(ctx) {
    const key = await getAccount(ctx).getDisplayPublicKey(
      ctx.query.valid.walletId
    )
    return { key }
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
  cli: { command: 'list-splittable-wallet-types', positional: 'walletId' },
  query: asWalletIdQuery,
  returns: asObject({
    walletTypes: doc(asArray(asString), 'Types valid for `split`.')
  }),
  errors: ['WALLET_NOT_FOUND'],

  async handler(ctx) {
    const walletTypes = await getAccount(ctx).listSplittableWalletTypes(
      ctx.query.valid.walletId
    )
    return { walletTypes }
  }
})

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
    positional: 'walletId',
    extra: {
      archived: { kind: 'boolstr', doc: 'Hide from the active list.' },
      deleted: { kind: 'boolstr', doc: 'Mark deleted.' },
      hidden: { kind: 'boolstr', doc: 'Hide from the wallet picker.' },
      sortIndex: { kind: 'string', doc: 'Position in the wallet list.' }
    },
    notes:
      'The command builds a single-wallet `walletStates` map from these flags, and needs at least one.'
  },
  body: asObject({
    walletStates: doc(
      asObject(
        asObject({
          archived: asOptional(asBoolean),
          deleted: asOptional(asBoolean),
          hidden: asOptional(asBoolean),
          sortIndex: asOptional(asNumber)
        }).withRest
      ),
      '`EdgeWalletStates`: wallet ids to the flags being changed.'
    )
  }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    await getAccount(ctx).changeWalletStates(
      ctx.body.walletStates as unknown as EdgeWalletStates
    )
    return undefined
  }
})
