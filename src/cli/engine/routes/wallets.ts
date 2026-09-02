import { div } from 'biggystring'
import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeAccount,
  EdgeCreateCurrencyWallet,
  EdgeCurrencyWallet,
  EdgeSplitCurrencyWallet
} from 'edge-core-js'

import { doc } from '../doc'
import { findWallet, getMultiplier, parseTokenId } from '../resolve'
import { route } from '../route'
import { asBalance, asCoreValue, asTokenId, asWalletSummary } from '../schemas'
import {
  getAccount,
  optionalQueryBoolean,
  optionalQueryInt,
  optionalQueryString
} from './helpers'

type WalletFilter = 'active' | 'archived' | 'hidden' | 'all'

function walletIdsForFilter(
  account: EdgeAccount,
  filter: WalletFilter
): string[] {
  switch (filter) {
    case 'archived':
      return account.archivedWalletIds
    case 'hidden':
      return account.hiddenWalletIds
    case 'all':
      return [
        ...account.activeWalletIds,
        ...account.archivedWalletIds,
        ...account.hiddenWalletIds
      ]
    case 'active':
    default:
      return account.activeWalletIds
  }
}

function summarizeWallet(wallet: EdgeCurrencyWallet): Record<string, unknown> {
  return {
    walletId: wallet.id,
    id: wallet.id,
    type: wallet.type,
    name: wallet.name,
    pluginId: wallet.currencyInfo.pluginId,
    currencyCode: wallet.currencyInfo.currencyCode,
    fiatCurrencyCode: wallet.fiatCurrencyCode,
    blockHeight: wallet.blockHeight,
    syncStatus: wallet.syncStatus,
    syncRatio:
      wallet.syncStatus?.totalRatio != null
        ? `${Math.round(wallet.syncStatus.totalRatio * 100)}%`
        : undefined,
    paused: wallet.paused,
    imported: wallet.imported,
    created: wallet.created?.toISOString() ?? null,
    enabledTokenIds: wallet.enabledTokenIds,
    detectedTokenIds: wallet.detectedTokenIds,
    unactivatedTokenIds: wallet.unactivatedTokenIds
  }
}

const WALLET_ERRORS = ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']

/**
 * List wallets.
 *
 * @note The REST default for `waitForAll` is false; the command defaults it to
 *   true. A raw HTTP caller that skips it can see an incomplete list.
 * @coreNote Filtered by account.activeWalletIds / archivedWalletIds /
 *   hiddenWalletIds.
 */
export const currencyWallets = route({
  core: 'account.currencyWallets',
  method: 'GET',
  path: '/account/{sessionId}/currency-wallets',
  cli: {
    command: 'currency-wallets',
    flags: { noWait: { maps: 'waitForAll', invert: true } }
  },
  query: asObject({
    filter: asOptional(
      doc(asString, '`active` (default), `archived`, `hidden`, or `all`.')
    ),
    waitForAll: asOptional(
      doc(
        asString,
        'Await every wallet to load first. Without it a freshly logged-in account may report fewer wallets than it has.'
      )
    )
  }).withRest,
  returns: asObject({ currencyWallets: asArray(asWalletSummary) }),

  async handler(ctx) {
    const account = getAccount(ctx)
    const filter = (optionalQueryString(ctx.query, 'filter') ??
      'active') as WalletFilter
    const waitForAll = optionalQueryBoolean(ctx.query, 'waitForAll') ?? false
    if (waitForAll) await account.waitForAllWallets()

    const ids = walletIdsForFilter(account, filter)
    const currencyWallets = ids
      .map(id => account.currencyWallets[id])
      .filter((wallet): wallet is EdgeCurrencyWallet => wallet != null)
      .map(summarizeWallet)
    return { currencyWallets }
  }
})

/**
 * Create a currency wallet.
 *
 * @note `fiatCurrencyCode` and `importText` are REST-only; the command has no
 *   flags for them.
 */
export const createCurrencyWallet = route({
  core: 'account.createCurrencyWallet',
  method: 'POST',
  path: '/account/{sessionId}/create-currency-wallet',
  cli: { command: 'create-currency-wallet', positional: 'walletType' },
  body: asObject({
    walletType: doc(
      asString,
      'From `currency-configs`, e.g. `wallet:bitcoin`.'
    ),
    name: asOptional(doc(asString, 'Display name.')),
    fiatCurrencyCode: asOptional(doc(asString, 'e.g. `iso:USD`.')),
    importText: asOptional(
      doc(asString, 'Seed or key text to import instead of generating.')
    )
  }).withRest,
  returns: asWalletSummary,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const wallet = await getAccount(ctx).createCurrencyWallet(
      ctx.body.walletType,
      {
        name: ctx.body.name,
        fiatCurrencyCode: ctx.body.fiatCurrencyCode,
        importText: ctx.body.importText
      }
    )
    return summarizeWallet(wallet)
  }
})

/**
 * Create several wallets at once.
 *
 * Partial success is normal: each entry reports its own outcome, and one
 * failure does not roll back the others.
 */
export const createCurrencyWallets = route({
  core: 'account.createCurrencyWallets',
  method: 'POST',
  path: '/account/{sessionId}/create-currency-wallets',
  cli: { command: 'create-currency-wallets', bodyFlag: 'create-wallets' },
  body: asObject({
    createWallets: doc(
      asArray(asCoreValue),
      '`EdgeCreateCurrencyWallet[]`: walletType, name, fiatCurrencyCode.'
    )
  }).withRest,
  returns: asObject({
    results: doc(
      asArray(asCoreValue),
      "Mirrors core's EdgeResult[]: `{ ok, wallet }` or `{ ok: false, error }`."
    )
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const results = await getAccount(ctx).createCurrencyWallets(
      ctx.body.createWallets as EdgeCreateCurrencyWallet[]
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
 * Wallet detail.
 *
 * @coreNote Engine composite of EdgeCurrencyWallet properties plus its
 *   EdgeCurrencyConfig token map.
 */
export const walletInfo = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/wallets/{walletId}',
  cli: 'wallet-info',
  returns: doc(
    asCoreValue,
    'Every WalletSummary field, plus denominations, walletSettings and allTokens.'
  ),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/rename-wallet',
  cli: 'rename-wallet',
  body: asObject({ name: doc(asString, 'The new display name.') }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/set-fiat-currency-code',
  cli: 'set-fiat-currency-code',
  body: asObject({
    fiatCurrencyCode: doc(asString, 'e.g. `iso:EUR`.')
  }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/change-paused',
  cli: 'change-paused',
  body: asObject({ paused: doc(asBoolean, 'True to stop syncing.') }).withRest,
  errors: ['BAD_REQUEST', ...WALLET_ERRORS],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/sync',
  cli: 'wallet-sync',
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/resync-blockchain',
  cli: 'resync-blockchain',
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/split',
  cli: { command: 'split', bodyFlag: 'split-wallets' },
  body: asObject({
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
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/dump-data',
  cli: 'dump-data',
  returns: doc(asCoreValue, '`EdgeDataDump`, straight from the plugin.'),
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/balance-map',
  cli: {
    command: 'balance-map',
    extra: {
      tokenId: {
        kind: 'string',
        doc: 'Client-side filter; core has no single-balance accessor.'
      }
    }
  },
  returns: asObject({ balances: asArray(asBalance) }),
  errors: WALLET_ERRORS,

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
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
  path: '/account/{sessionId}/wallets/{walletId}/get-addresses',
  cli: 'get-addresses',
  query: asObject({
    tokenId: asOptional(doc(asTokenId, 'Defaults to the native asset.')),
    forceIndex: asOptional(doc(asString, 'Derive at a specific index.'))
  }).withRest,
  returns: asObject({
    addresses: doc(
      asArray(asCoreValue),
      '`EdgeAddress[]`: addressType, publicAddress, nativeBalance.'
    )
  }),
  errors: WALLET_ERRORS,

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
    const forceIndex = optionalQueryInt(ctx.query, 'forceIndex')
    const addresses = await wallet.getAddresses({ tokenId, forceIndex })
    return { addresses }
  }
})
