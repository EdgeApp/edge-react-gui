import { div } from 'biggystring'
import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'

import { getDisplayDenom } from '../../../util/exchangeDenom'
import { toIsoFiatCode } from '../../../util/fiatCode'
import { hasOwn } from '../../../util/predicates'
import { doc } from '../doc'
import { WALLET_ERRORS } from '../errorGroups'
import { engineError } from '../errors'
import { TOKEN_ID_DOC } from '../fieldDocs'
import { assertTokenId, findWallet } from '../resolve'
import { route } from '../route'
import {
  asBalance,
  asCoreValue,
  asCreateCurrencyWallet,
  asQueryNonNegativeInteger,
  asRequestTokenId,
  asWalletId
} from '../schemas'
import {
  getAccount,
  pluginIdsByWalletType,
  readAccountSyncedSettings,
  summarizeWallet,
  summarizeWalletResults
} from './helpers'

/**
 * Wallet detail.
 *
 * @coreNote Engine composite of EdgeCurrencyWallet properties plus its
 *   EdgeCurrencyConfig token map.
 */
export const walletInfo = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/wallet',
  cli: 'wallet-info',
  query: asObject({ walletId: asWalletId }).withRest,
  returns: doc(
    asCoreValue,
    'Every WalletSummary field, plus denominations and walletSettings. `allTokens` is not here \u2014 `wallet-tokens` exists to carry it, and returning it from both sent the same map twice in a session that calls both.'
  ),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    return {
      ...summarizeWallet(wallet),
      denominations: wallet.currencyInfo.denominations,
      walletSettings: wallet.walletSettings
    }
  }
})

/**
 * Rename a wallet.
 */
export const renameWallet = route({
  core: 'wallet.renameWallet',
  method: 'POST',
  path: '/account/{sessionId}/wallet/rename-wallet',
  cli: 'rename-wallet',
  body: asObject({
    walletId: asWalletId,
    name: doc(asString, 'The new display name.')
  }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.renameWallet(ctx.body.name)
    return undefined
  }
})

/**
 * Change a wallet's fiat currency.
 *
 * Affects how balances and history are priced, not the asset itself.
 */
export const setFiatCurrencyCode = route({
  core: 'wallet.setFiatCurrencyCode',
  method: 'POST',
  path: '/account/{sessionId}/wallet/set-fiat-currency-code',
  cli: 'set-fiat-currency-code',
  body: asObject({
    walletId: asWalletId,
    fiatCurrencyCode: doc(
      asString,
      'An ISO 4217 code, with or without core\u2019s `iso:` prefix: `iso:EUR` and `EUR` both work, and the engine normalises. Core itself refuses a bare code, as an untyped throw this route reported as a `500` \u2014 and `get-transactions --fiat` already takes the bare form, so the two were inconsistent as well. Anything that is not three letters is a `400`.'
    )
  }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // Normalised here, and refused here when it cannot be. Core's own
    // refusal is a plain `Error('Fiat currency codes must start with
    // `iso:`')`, which the engine maps to `500 INTERNAL_ERROR` — a code
    // published as "unmapped engine or plugin failure", exiting 1, on a
    // route whose declared errors include the `BAD_REQUEST` this is. The
    // field doc said only "e.g. `iso:EUR`", so `--fiat-currency-code=EUR`
    // is the ordinary mistake — and `get-transactions --fiat` takes the
    // bare form, so refusing it here would be the CLI disagreeing with
    // itself. `toIsoFiatCode` is the same helper that one uses.
    const isoFiat = toIsoFiatCode(ctx.body.fiatCurrencyCode)
    if (isoFiat == null) {
      throw engineError(
        'BAD_REQUEST',
        'fiatCurrencyCode must be a three-letter ISO 4217 code, with or ' +
          'without the `iso:` prefix \u2014 `iso:EUR` or `EUR`.',
        400
      )
    }
    await wallet.setFiatCurrencyCode(isoFiat)
    return undefined
  }
})

/**
 * Pause or resume a wallet engine.
 *
 * A paused wallet stops syncing, which is how a caller quiets a chain it does
 * not currently care about.
 */
export const changePaused = route({
  core: 'wallet.changePaused',
  method: 'POST',
  path: '/account/{sessionId}/wallet/change-paused',
  cli: 'change-paused',
  body: asObject({
    walletId: asWalletId,
    paused: doc(asBoolean, 'True to stop syncing.')
  }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.changePaused(ctx.body.paused)
    return undefined
  }
})

/**
 * Nudge one wallet to sync.
 *
 * @note Named `wallet-sync` on the CLI because `sync` is `account.sync`.
 */
export const walletSync = route({
  core: 'wallet.sync',
  method: 'POST',
  path: '/account/{sessionId}/wallet/sync',
  cli: 'wallet-sync',
  body: asObject({ walletId: asWalletId }).withRest,
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.sync()
    return undefined
  }
})

/**
 * Rescan the blockchain from scratch.
 *
 * Drops cached chain state and re-scans. Expensive, and the wallet reports an
 * incomplete balance until it finishes.
 *
 * @note Returns when the resync is requested, not when it completes. Watch
 *   `syncRatio` for progress.
 */
export const resyncBlockchain = route({
  core: 'wallet.resyncBlockchain',
  method: 'POST',
  path: '/account/{sessionId}/wallet/resync-blockchain',
  cli: 'resync-blockchain',
  body: asObject({ walletId: asWalletId }).withRest,
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.resyncBlockchain()
    return undefined
  }
})

/**
 * Split a wallet into another chain.
 *
 * Forked-chain support: derive a wallet of a different type from the same
 * keys. `list-splittable-wallet-types` says which are valid.
 *
 * @note A `walletType` no plugin claims is a `400` from this route, before
 *   core is called. Core throws `Cannot find plugin for wallet type "…"` for
 *   it, which arrived as `500 INTERNAL_ERROR` — the caller mistake this
 *   route's own description sends them to `list-splittable-wallet-types` to
 *   avoid, reported as an engine fault.
 * @note A plugin that fails *during* the split still abandons the rest of
 *   the list: core's `split` is one call. `create-currency-wallets` is one
 *   call too, but refuses an unclaimed type per entry before core is called
 *   and retries entry by entry when core's batch refuses before storing
 *   anything, so each of its entries gets its own outcome.
 */
export const splitWallet = route({
  core: 'wallet.split',
  method: 'POST',
  path: '/account/{sessionId}/wallet/split',
  cli: 'split',
  body: asObject({
    walletId: asWalletId,
    splitWallets: doc(
      asArray(asCreateCurrencyWallet),
      '`EdgeSplitCurrencyWallet[]`: walletType, plus optional name and fiatCurrencyCode.'
    )
  }).withRest,
  returns: asObject({
    results: doc(asArray(asCoreValue), 'Per-entry outcomes, like batch create.')
  }),
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const account = getAccount(ctx)
    const wallet = findWallet(account, ctx.body.walletId)
    // Each type checked against the plugins that are actually here, which is
    // the same set `list-splittable-wallet-types` filters. The map is built
    // once rather than re-walking the whole plugin table per requested
    // split, and it is the same derivation `unloadedWallets` uses.
    const pluginIds = pluginIdsByWalletType(account)
    for (const split of ctx.body.splitWallets) {
      if (!pluginIds.has(split.walletType)) {
        throw engineError(
          'BAD_REQUEST',
          `No plugin claims wallet type "${split.walletType}". ` +
            '`list-splittable-wallet-types` lists the types this wallet can ' +
            'be split into.',
          400
        )
      }
    }
    const results = await wallet.split(ctx.body.splitWallets)
    return summarizeWalletResults(results)
  }
})

/**
 * Dump wallet engine state.
 *
 * Plugin-defined debug output. Shape varies by plugin and can be very large.
 */
export const dumpData = route({
  core: 'wallet.dumpData',
  method: 'GET',
  path: '/account/{sessionId}/wallet/dump-data',
  cli: 'dump-data',
  query: asObject({ walletId: asWalletId }).withRest,
  returns: doc(asCoreValue, '`EdgeDataDump`, straight from the plugin.'),
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    return await wallet.dumpData()
  }
})

/**
 * Balances for every asset in the wallet.
 *
 * The native currency plus every enabled token, including an enabled token
 * the plugin has reported no balance for, which holds `0`.
 *
 * @note On the CLI, omit `--token-id` for the native asset rather than passing
 *   the literal `null`.
 * @coreNote Rendered as an array, with currencyCode and displayAmount added
 *   from the wallet's denominations.
 */
export const balanceMap = route({
  core: 'wallet.balanceMap',
  method: 'GET',
  path: '/account/{sessionId}/wallet/balance-map',
  cli: {
    command: 'balance-map',
    custom: true,
    extra: {
      tokenId: {
        kind: 'string',
        doc: 'Client-side filter; core has no single-balance accessor. An id this wallet tracks no asset for is a `404 TOKEN_NOT_FOUND` from the client, not an empty list — `balanceMap` carries every asset the wallet tracks, an enabled token at zero included, so nothing matching means nothing to match.'
      }
    }
  },
  query: asObject({ walletId: asWalletId }).withRest,
  returns: asObject({
    balances: doc(
      asArray(asBalance),
      'One entry per asset the wallet tracks, native coin first: `tokenId`, `currencyCode`, `nativeAmount`, `displayAmount` and `unknownToken`. Every *enabled* token is here whether or not the plugin has a balance for it \u2014 one it has not reported holds `0`, because a plugin populates `balanceMap` when it has an amount rather than when the token is enabled, and a freshly enabled token was simply missing. A token the plugin reports a balance for but whose config it no longer carries is listed with `unknownToken: true` and a null `displayAmount`, rather than failing the whole wallet.'
    )
  }),
  errors: [...WALLET_ERRORS, 'SETTINGS_UNREADABLE'],

  async handler(ctx) {
    const account = getAccount(ctx)
    const wallet = findWallet(account, ctx.query.valid.walletId)
    // The *display* denomination, which is what this field's own doc
    // promises and what the GUI's wallet row and this branch's CSV export
    // both show. It used to divide by the exchange multiplier, so a BTC
    // wallet the user had set to "bits" answered `0.0005` where both of
    // those said `50000`, and a token on a custom unit was out by its own
    // factor — on the one field a script would compare against the app.
    // `get-transactions`'s export arm reads the same settings through the
    // same derivation; an empty `denominationSettings` falls through to
    // the exchange denomination, which is the right default.
    const { denominationSettings } = await readAccountSyncedSettings(account)
    // One rule per entry, and the listing stays alive. Two adjacent lines
    // used to disagree: the multiplier lookup threw TOKEN_NOT_FOUND for an
    // absent token while the line below it tolerated the same absence with
    // `?? tokenId`. `wallet.balanceMap` is not filtered against `allTokens`,
    // so a token deleted from the config while the engine ran made
    // `balance-map` answer 404 for the *whole wallet*, naming a token the
    // caller never asked about, until the engine restarted.
    // Every asset the wallet tracks, which is not the same as every key in
    // `balanceMap`: a plugin populates that map for a token when it has a
    // balance to report, not when the token is enabled. So a freshly
    // enabled token on a fully synced wallet was absent — and this route's
    // own summary says "the native currency plus every enabled token",
    // while the client's `--token-id` filter answered
    // `404 TOKEN_NOT_FOUND` for an id `wallet-tokens` listed and the wallet
    // had enabled. Measured on solana and algorand, so it is not one
    // plugin's quirk. An enabled token the map does not mention holds
    // nothing, which is `'0'`.
    const amounts = new Map(wallet.balanceMap)
    // The native asset first, and for the same reason one key short of the
    // loop below it: core's reducer starts `balanceMap` as `new Map()` and
    // fills a key only when an engine reports an amount, so a freshly
    // created or still-syncing wallet answered `{"balances": []}` — no row
    // for the chain's own coin, contradicting this route's summary, and a
    // `404 TOKEN_NOT_FOUND` from the client's `--token-id` filter for the
    // native asset. A wallet that has reported nothing holds nothing, which
    // is `'0'`.
    if (!amounts.has(null)) amounts.set(null, '0')
    for (const tokenId of wallet.enabledTokenIds) {
      if (!amounts.has(tokenId)) amounts.set(tokenId, '0')
    }
    const balances = []
    for (const [tokenId, nativeAmount] of amounts.entries()) {
      // `hasOwn`, because a tokenId is caller-shaped data: `allTokens` is a
      // plain object, so `__proto__` or `toString` as a key resolved to an
      // inherited member and passed the `token == null` test below.
      const token =
        tokenId != null && hasOwn(wallet.currencyConfig.allTokens, tokenId)
          ? wallet.currencyConfig.allTokens[tokenId]
          : null
      if (tokenId != null && token == null) {
        // The plugin still reports a balance for an asset its config no
        // longer describes. Nothing here can price or name it, so report it
        // as unknown rather than failing the wallet.
        balances.push({
          tokenId,
          currencyCode: tokenId,
          nativeAmount,
          displayAmount: null,
          unknownToken: true
        })
        continue
      }
      const multiplier = getDisplayDenom(
        denominationSettings,
        wallet.currencyConfig,
        tokenId
      ).multiplier
      balances.push({
        tokenId,
        currencyCode: token?.currencyCode ?? wallet.currencyInfo.currencyCode,
        nativeAmount,
        displayAmount: div(nativeAmount, multiplier, 18),
        unknownToken: false
      })
    }
    return { balances }
  }
})

/**
 * Receive addresses.
 */
export const getAddresses = route({
  core: 'wallet.getAddresses',
  method: 'GET',
  path: '/account/{sessionId}/wallet/get-addresses',
  cli: 'get-addresses',
  query: asObject({
    walletId: asWalletId,
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    forceIndex: asOptional(
      doc(asQueryNonNegativeInteger, 'Derive at a specific index.')
    )
  }).withRest,
  returns: asObject({
    addresses: doc(
      asArray(asCoreValue),
      '`EdgeAddress[]`: addressType, publicAddress, nativeBalance.'
    )
  }),
  errors: ['TOKEN_NOT_FOUND', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const { tokenId, forceIndex } = ctx.query.valid
    assertTokenId(wallet, tokenId)
    const addresses = await wallet.getAddresses({ tokenId, forceIndex })
    return { addresses }
  }
})
