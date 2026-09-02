import { findWallet } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import { getAccount, requireStringArray } from './helpers'

export function registerTokenRoutes(router: Router): void {
  /** Engine composite of EdgeCurrencyConfig token maps and wallet token lists. */
  router.add('GET', '/accounts/{sessionId}/wallets/{walletId}/tokens', ctx => {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    return {
      allTokens: wallet.currencyConfig.allTokens,
      builtinTokens: wallet.currencyConfig.builtinTokens,
      customTokens: wallet.currencyConfig.customTokens,
      enabledTokenIds: wallet.enabledTokenIds,
      detectedTokenIds: wallet.detectedTokenIds
    }
  })

  /** wallet.changeEnabledTokenIds(tokenIds) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/change-enabled-token-ids',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const tokenIds = requireStringArray(body, 'tokenIds')
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      await wallet.changeEnabledTokenIds(tokenIds)
      return { enabledTokenIds: wallet.enabledTokenIds }
    }
  )
}
