import { div } from 'biggystring'
import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'

import { doc } from '../doc'
import { WALLET_ERRORS } from '../errorGroups'
import { TOKEN_ID_DOC } from '../fieldDocs'
import { assertTokenId, findWallet, getMultiplier } from '../resolve'
import { route } from '../route'
import {
  asBalance,
  asCoreValue,
  asCreateCurrencyWallet,
  asQueryNonNegativeInteger,
  asRequestTokenId,
  asWalletId
} from '../schemas'
import { getAccount, summarizeWallet } from './helpers'

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
    fiatCurrencyCode: doc(asString, 'e.g. `iso:EUR`.')
  }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.setFiatCurrencyCode(ctx.body.fiatCurrencyCode)
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
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const results = await wallet.split(ctx.body.splitWallets)
    return {
      results: results.map(result =>
        result.ok
          ? { ok: true, wallet: summarizeWallet(result.result) }
          : {
              ok: false,
              error:
                result.error instanceof Error
                  ? result.error.message
                  : String(result.error)
            }
      )
    }
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
 * The native currency plus every enabled token.
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
        doc: 'Client-side filter; core has no single-balance accessor.'
      }
    }
  },
  query: asObject({ walletId: asWalletId }).withRest,
  returns: asObject({
    balances: doc(
      asArray(asBalance),
      'One entry per asset the wallet holds, native coin first: `tokenId`, `currencyCode`, `nativeAmount`, `displayAmount` and `unknownToken`. A token the plugin reports a balance for but whose config it no longer carries is listed with `unknownToken: true` and a null `displayAmount`, rather than failing the whole wallet.'
    )
  }),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    // One rule per entry, and the listing stays alive. Two adjacent lines
    // used to disagree: `getMultiplier` threw TOKEN_NOT_FOUND for an absent
    // token while the line below it tolerated the same absence with
    // `?? tokenId`. `wallet.balanceMap` is not filtered against `allTokens`,
    // so a token deleted from the config while the engine ran made
    // `balance-map` answer 404 for the *whole wallet*, naming a token the
    // caller never asked about, until the engine restarted.
    const balances = []
    for (const [tokenId, nativeAmount] of wallet.balanceMap.entries()) {
      const token =
        tokenId == null ? null : wallet.currencyConfig.allTokens[tokenId]
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
      const multiplier = getMultiplier(wallet, tokenId)
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
