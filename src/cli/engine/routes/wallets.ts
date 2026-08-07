import { div } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { engineError } from '../errors'
import { findWallet, getMultiplier, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalBoolean,
  optionalQueryBoolean,
  optionalQueryString,
  optionalString,
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
  router.add('GET', '/v1/accounts/{sessionId}/wallets', async ctx => {
    const account = getAccount(ctx)
    const filter = (optionalQueryString(ctx.query, 'filter') ??
      'active') as WalletFilter
    const waitForAll = optionalQueryBoolean(ctx.query, 'waitForAll') ?? false
    if (waitForAll) await account.waitForAllWallets()

    const ids = walletIdsForFilter(account, filter)
    const wallets = ids
      .map(id => account.currencyWallets[id])
      .filter((wallet): wallet is EdgeCurrencyWallet => wallet != null)
      .map(summarizeWallet)
    return { wallets }
  })

  router.add('POST', '/v1/accounts/{sessionId}/wallets', async ctx => {
    const body = requireBodyObject(ctx.body)
    const walletType = requireString(body, 'walletType')
    const name = optionalString(body, 'name')
    const fiatCurrencyCode = optionalString(body, 'fiatCurrencyCode')
    const wallet = await getAccount(ctx).createCurrencyWallet(walletType, {
      name,
      fiatCurrencyCode
    })
    return summarizeWallet(wallet)
  })

  router.add('POST', '/v1/accounts/{sessionId}/wallets/batch', async ctx => {
    const body = requireBodyObject(ctx.body)
    const wallets = body.wallets
    if (!Array.isArray(wallets)) {
      throw engineError('BAD_REQUEST', 'Field "wallets" must be an array', 400)
    }
    const results = await getAccount(ctx).createCurrencyWallets(wallets)
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
  })

  router.add('GET', '/v1/accounts/{sessionId}/wallets/{walletId}', ctx => {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    return {
      ...summarizeWallet(wallet),
      walletSettings: wallet.walletSettings,
      allTokens: wallet.currencyConfig.allTokens
    }
  })

  router.add(
    'PATCH',
    '/v1/accounts/{sessionId}/wallets/{walletId}',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const name = optionalString(body, 'name')
      if (name != null) await wallet.renameWallet(name)
      const fiatCurrencyCode = optionalString(body, 'fiatCurrencyCode')
      if (fiatCurrencyCode != null) {
        await wallet.setFiatCurrencyCode(fiatCurrencyCode)
      }
      const paused = optionalBoolean(body, 'paused')
      if (paused != null) await wallet.changePaused(paused)
      return summarizeWallet(wallet)
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/sync',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.sync()
      return { ok: true }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/resync',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.resyncBlockchain()
      return { ok: true }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/split',
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

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/dump',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      return await wallet.dumpData()
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/splittable-types',
    async ctx => {
      const account = getAccount(ctx)
      // Ensures the walletId is valid & belongs to this account:
      findWallet(account, ctx.params.walletId)
      const types = await account.listSplittableWalletTypes(ctx.params.walletId)
      return { types }
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/balances',
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

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/balances/{tokenId}',
    ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(ctx.params.tokenId)
      const nativeAmount = wallet.balanceMap.get(tokenId) ?? '0'
      const multiplier = getMultiplier(wallet, tokenId)
      return {
        tokenId,
        nativeAmount,
        displayAmount: div(nativeAmount, multiplier, 18)
      }
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/addresses',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const addresses = await wallet.getAddresses({ tokenId })
      return { addresses }
    }
  )
}
