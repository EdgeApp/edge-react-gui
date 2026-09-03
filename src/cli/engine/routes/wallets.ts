import { div } from 'biggystring'
import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import type { EdgeSplitCurrencyWallet } from 'edge-core-js'

import { doc } from '../doc'
import { findWallet, getMultiplier } from '../resolve'
import { route } from '../route'
import {
  asBalance,
  asCoreValue,
  asQueryInteger,
  asQueryTokenId,
  asWalletId
} from '../schemas'
import { getAccount, summarizeWallet } from './helpers'

const WALLET_ERRORS = ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']

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
    'Every WalletSummary field, plus denominations, walletSettings and allTokens.'
  ),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    return {
      ...summarizeWallet(wallet),
      denominations: wallet.currencyInfo.denominations,
      walletSettings: wallet.walletSettings,
      allTokens: wallet.currencyConfig.allTokens
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
      asArray(asCoreValue),
      '`EdgeSplitCurrencyWallet[]`: walletType, name, fiatCurrencyCode.'
    )
  }).withRest,
  returns: asObject({
    results: doc(asArray(asCoreValue), 'Per-entry outcomes, like batch create.')
  }),
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const results = await wallet.split(
      ctx.body.splitWallets as EdgeSplitCurrencyWallet[]
    )
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
      'One entry per asset the wallet holds, native coin first.'
    )
  }),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const balances = [...wallet.balanceMap.entries()].map(
      ([tokenId, nativeAmount]) => {
        const multiplier = getMultiplier(wallet, tokenId)
        return {
          tokenId,
          currencyCode:
            tokenId == null
              ? wallet.currencyInfo.currencyCode
              : wallet.currencyConfig.allTokens[tokenId]?.currencyCode ??
                tokenId,
          nativeAmount,
          displayAmount: div(nativeAmount, multiplier, 18)
        }
      }
    )
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
    tokenId: asOptional(
      doc(asQueryTokenId, 'Defaults to the native asset.'),
      null
    ),
    forceIndex: asOptional(doc(asQueryInteger, 'Derive at a specific index.'))
  }).withRest,
  returns: asObject({
    addresses: doc(
      asArray(asCoreValue),
      '`EdgeAddress[]`: addressType, publicAddress, nativeBalance.'
    )
  }),
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const { tokenId, forceIndex } = ctx.query.valid
    const addresses = await wallet.getAddresses({ tokenId, forceIndex })
    return { addresses }
  }
})
