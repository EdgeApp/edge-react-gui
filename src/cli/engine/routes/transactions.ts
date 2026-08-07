import type {
  EdgeAssetAction,
  EdgeMetadataChange,
  EdgeTxAction
} from 'edge-core-js'

import { findWallet, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalQueryDate,
  optionalQueryInt,
  optionalQueryString
} from './helpers'

export function registerTransactionRoutes(router: Router): void {
  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/transactions',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const startDate = optionalQueryDate(ctx.query, 'startDate')
      const endDate = optionalQueryDate(ctx.query, 'endDate')
      const searchString = optionalQueryString(ctx.query, 'search')
      const spamThreshold = optionalQueryString(ctx.query, 'spamThreshold')
      const limit = optionalQueryInt(ctx.query, 'limit')
      const offset = optionalQueryInt(ctx.query, 'offset') ?? 0

      const transactions = await wallet.getTransactions({
        tokenId,
        startDate,
        endDate,
        searchString,
        spamThreshold
      })

      const sliced =
        limit == null
          ? transactions.slice(offset)
          : transactions.slice(offset, offset + limit)

      return { transactions: sliced, total: transactions.length }
    }
  )

  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/transactions/count',
    async ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const count = await wallet.getNumTransactions({ tokenId })
      return { count }
    }
  )

  router.add(
    'PATCH',
    '/v1/accounts/{sessionId}/wallets/{walletId}/transactions/{txid}',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(
        typeof body.tokenId === 'string' ? body.tokenId : undefined
      )
      const { txid } = ctx.params

      if (body.metadata != null && typeof body.metadata === 'object') {
        await wallet.saveTxMetadata({
          txid,
          tokenId,
          metadata: body.metadata as EdgeMetadataChange
        })
      }

      if (body.savedAction != null && typeof body.savedAction === 'object') {
        const assetAction =
          body.assetAction != null && typeof body.assetAction === 'object'
            ? (body.assetAction as EdgeAssetAction)
            : { assetActionType: 'transfer' as const }
        await wallet.saveTxAction({
          txid,
          tokenId,
          assetAction,
          savedAction: body.savedAction as EdgeTxAction
        })
      }

      return undefined
    }
  )
}
