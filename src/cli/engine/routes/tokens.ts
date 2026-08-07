import { engineError } from '../errors'
import { findWallet } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString, requireStringArray } from './helpers'

export function registerTokenRoutes(router: Router): void {
  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/tokens',
    ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      return {
        allTokens: wallet.currencyConfig.allTokens,
        builtinTokens: wallet.currencyConfig.builtinTokens,
        customTokens: wallet.currencyConfig.customTokens,
        enabledTokenIds: wallet.enabledTokenIds,
        detectedTokenIds: wallet.detectedTokenIds
      }
    }
  )

  router.add(
    'PUT',
    '/v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const tokenIds = requireStringArray(body, 'tokenIds')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.changeEnabledTokenIds(tokenIds)
      return { enabledTokenIds: wallet.enabledTokenIds }
    }
  )

  router.add(
    'POST',
    '/v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const tokenId = requireString(body, 'tokenId')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenIds = new Set(wallet.enabledTokenIds)
      tokenIds.add(tokenId)
      await wallet.changeEnabledTokenIds([...tokenIds])
      return { enabledTokenIds: wallet.enabledTokenIds }
    }
  )

  router.add(
    'DELETE',
    '/v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens/{tokenId}',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      if (!wallet.enabledTokenIds.includes(ctx.params.tokenId)) {
        throw engineError(
          'TOKEN_NOT_ENABLED',
          `Token not enabled: ${ctx.params.tokenId}`,
          404
        )
      }
      const tokenIds = wallet.enabledTokenIds.filter(
        id => id !== ctx.params.tokenId
      )
      await wallet.changeEnabledTokenIds(tokenIds)
      return { enabledTokenIds: wallet.enabledTokenIds }
    }
  )
}
