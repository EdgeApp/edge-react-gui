import type {
  EdgeAccount,
  EdgeAssetAction,
  EdgeCurrencyWallet,
  EdgeMetadataChange,
  EdgeTransaction,
  EdgeTxAction
} from 'edge-core-js'

import { resolveListSpamThreshold } from '../../../util/spamThreshold'
import {
  fillTxMetadataForDisplay,
  getTxActionDisplayInfo
} from '../../../util/txDisplay'
import { findWallet, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalQueryDate,
  optionalQueryInt,
  optionalQueryString
} from './helpers'

/**
 * Fill name/category/notes from the same merge the GUI list uses.
 * Response-only — does not call saveTxMetadata.
 */
function overlayDisplayMetadata(
  tx: EdgeTransaction,
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): EdgeTransaction {
  const { mergedData } = getTxActionDisplayInfo(tx, account, wallet)
  return fillTxMetadataForDisplay(tx, mergedData)
}

export function registerTransactionRoutes(router: Router): void {
  router.add(
    'GET',
    '/v1/accounts/{sessionId}/wallets/{walletId}/transactions',
    async ctx => {
      const account = getAccount(ctx)
      const wallet = findWallet(account, ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const startDate = optionalQueryDate(ctx.query, 'startDate')
      const endDate = optionalQueryDate(ctx.query, 'endDate')
      const searchString = optionalQueryString(ctx.query, 'searchString')
      const spamThreshold = await resolveListSpamThreshold({
        account,
        wallet,
        tokenId,
        queryOverride: ctx.query.has('spamThreshold')
          ? ctx.query.get('spamThreshold') ?? ''
          : undefined
      })
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

      return {
        transactions: sliced.map(tx =>
          overlayDisplayMetadata(tx, account, wallet)
        ),
        total: transactions.length
      }
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
