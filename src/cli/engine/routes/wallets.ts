import { div } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { engineError } from '../errors'
import { findWallet, getMultiplier, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalQueryBoolean,
  optionalQueryInt,
  optionalQueryString,
  optionalString,
  requireBoolean,
  requireString
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

export function registerWalletsRoutes(router: Router): void {
  /** account.currencyWallets */
  router.add('GET', '/accounts/{sessionId}/currency-wallets', async ctx => {
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
  })

  /** account.createCurrencyWallet(walletType, opts) */
  router.add(
    'POST',
    '/accounts/{sessionId}/create-currency-wallet',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const walletType = requireString(body, 'walletType')
      const name = optionalString(body, 'name')
      const fiatCurrencyCode = optionalString(body, 'fiatCurrencyCode')
      const importText = optionalString(body, 'importText')
      const wallet = await getAccount(ctx).createCurrencyWallet(walletType, {
        name,
        fiatCurrencyCode,
        importText
      })
      return summarizeWallet(wallet)
    }
  )

  /** account.createCurrencyWallets(createWallets) */
  router.add(
    'POST',
    '/accounts/{sessionId}/create-currency-wallets',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const createWallets = body.createWallets
      if (!Array.isArray(createWallets)) {
        throw engineError(
          'BAD_REQUEST',
          'Field "createWallets" must be an array',
          400
        )
      }
      const results = await getAccount(ctx).createCurrencyWallets(createWallets)
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
  )

  /** Engine composite: EdgeCurrencyWallet properties plus its currency config. */
  router.add('GET', '/accounts/{sessionId}/wallets/{walletId}', ctx => {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    return {
      ...summarizeWallet(wallet),
      denominations: wallet.currencyInfo.denominations,
      walletSettings: wallet.walletSettings,
      allTokens: wallet.currencyConfig.allTokens
    }
  })

  /** wallet.renameWallet(name) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/rename-wallet',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const name = requireString(body, 'name')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.renameWallet(name)
      return undefined
    }
  )

  /** wallet.setFiatCurrencyCode(fiatCurrencyCode) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/set-fiat-currency-code',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const fiatCurrencyCode = requireString(body, 'fiatCurrencyCode')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.setFiatCurrencyCode(fiatCurrencyCode)
      return undefined
    }
  )

  /** wallet.changePaused(paused) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/change-paused',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const paused = requireBoolean(body, 'paused')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.changePaused(paused)
      return undefined
    }
  )

  /** wallet.sync() */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/sync',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.sync()
      return undefined
    }
  )

  /** wallet.resyncBlockchain() */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/resync-blockchain',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.resyncBlockchain()
      return undefined
    }
  )

  /** wallet.split(splitWallets) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/split',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const splitWallets = body.splitWallets
      if (!Array.isArray(splitWallets)) {
        throw engineError(
          'BAD_REQUEST',
          'Field "splitWallets" must be an array',
          400
        )
      }
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const results = await wallet.split(splitWallets)
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
  )

  /** wallet.dumpData() */
  router.add(
    'GET',
    '/accounts/{sessionId}/wallets/{walletId}/dump-data',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      return await wallet.dumpData()
    }
  )

  /** wallet.balanceMap */
  router.add(
    'GET',
    '/accounts/{sessionId}/wallets/{walletId}/balance-map',
    ctx => {
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
  )

  /** wallet.getAddresses(opts) */
  router.add(
    'GET',
    '/accounts/{sessionId}/wallets/{walletId}/get-addresses',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const forceIndex = optionalQueryInt(ctx.query, 'forceIndex')
      const addresses = await wallet.getAddresses({ tokenId, forceIndex })
      return { addresses }
    }
  )
}
