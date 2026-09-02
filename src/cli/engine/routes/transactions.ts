import type {
  EdgeAccount,
  EdgeAssetAction,
  EdgeCurrencyWallet,
  EdgeMetadataChange,
  EdgeTransaction,
  EdgeTxAction
} from 'edge-core-js'

import { getExchangeDenom } from '../../../util/exchangeDenom'
import {
  exportTxInfoKey,
  mergeExportTxInfo,
  readExportTxInfoMap
} from '../../../util/exportTxInfo'
import { fillTxsFiat, toIsoFiatCode } from '../../../util/fillTxsFiat'
import {
  readDefaultIsoFiat,
  resolveListSpamThreshold
} from '../../../util/spamThreshold'
import {
  fillTxMetadataForDisplay,
  getTxActionDisplayInfo
} from '../../../util/txDisplay'
import {
  exportTransactionsToBitwave,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO,
  parseExportFormats,
  type TxExportFormat
} from '../../../util/txExport'
import { engineError } from '../errors'
import { findWallet, parseTokenId } from '../resolve'
import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalQueryDate,
  optionalQueryInt,
  optionalQueryString,
  requireString
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
  /** wallet.getTransactions(opts), plus engine paging, fiat fill and export. */
  router.add(
    'GET',
    '/accounts/{sessionId}/wallets/{walletId}/get-transactions',
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

      const fiatRaw = optionalQueryString(ctx.query, 'fiat')
      let isoFiat: string
      if (fiatRaw != null && fiatRaw !== '') {
        const parsed = toIsoFiatCode(fiatRaw)
        if (parsed == null) {
          throw engineError(
            'BAD_REQUEST',
            'Query "fiat" must be a 3-letter currency code (e.g. USD)',
            400
          )
        }
        isoFiat = parsed
      } else {
        isoFiat = await readDefaultIsoFiat(account)
      }

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

      const overlayed = sliced.map(tx =>
        overlayDisplayMetadata(tx, account, wallet)
      )
      await fillTxsFiat({
        wallet,
        tokenId,
        isoFiat,
        txs: overlayed
      })

      const exportRaw = optionalQueryString(ctx.query, 'exportFormat')
      let formats: TxExportFormat[]
      try {
        formats = parseExportFormats(exportRaw)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw engineError('BAD_REQUEST', message, 400)
      }

      const bitwaveAccountIdQuery = optionalQueryString(
        ctx.query,
        'bitwaveAccountId'
      )
      if (bitwaveAccountIdQuery != null && !formats.includes('bitwave')) {
        throw engineError(
          'BAD_REQUEST',
          'Query "bitwaveAccountId" requires exportFormat to include bitwave',
          400
        )
      }

      if (formats.length === 0) {
        return {
          transactions: overlayed,
          total: transactions.length,
          isoFiat
        }
      }

      const denom = getExchangeDenom(wallet.currencyConfig, tokenId)
      const currencyCode =
        tokenId == null
          ? wallet.currencyInfo.currencyCode
          : wallet.currencyConfig.allTokens[tokenId]?.currencyCode ?? tokenId

      let bitwaveAccountId: string | undefined
      if (formats.includes('bitwave')) {
        if (bitwaveAccountIdQuery != null && bitwaveAccountIdQuery !== '') {
          bitwaveAccountId = bitwaveAccountIdQuery
          await mergeExportTxInfo(wallet, tokenId, {
            bitwaveAccountId,
            isExportBitwave: true
          })
        } else {
          let saved: string | undefined
          try {
            const map = await readExportTxInfoMap(wallet)
            saved = map[exportTxInfoKey(wallet, tokenId)]?.bitwaveAccountId
          } catch {
            saved = undefined
          }
          if (saved == null || saved === '') {
            throw engineError(
              'MISSING_BITWAVE_ACCOUNT_ID',
              'Bitwave export requires bitwaveAccountId (query or exportTxInfo.json)',
              400
            )
          }
          bitwaveAccountId = saved
        }
      }

      const files: Array<{ format: TxExportFormat; contents: string }> = []
      for (const format of formats) {
        if (format === 'csv') {
          files.push({
            format,
            contents: exportTransactionsToCSVInner(
              overlayed,
              currencyCode,
              isoFiat,
              denom.multiplier,
              denom.name
            )
          })
        } else if (format === 'qbo') {
          files.push({
            format,
            contents: exportTransactionsToQBO(
              overlayed,
              isoFiat,
              denom.multiplier
            )
          })
        } else {
          files.push({
            format,
            contents: await exportTransactionsToBitwave(
              bitwaveAccountId!,
              overlayed,
              currencyCode,
              denom.multiplier
            )
          })
        }
      }

      return {
        ok: true,
        isoFiat,
        total: transactions.length,
        files
      }
    }
  )

  /** wallet.getNumTransactions(opts) */
  router.add(
    'GET',
    '/accounts/{sessionId}/wallets/{walletId}/get-num-transactions',
    ctx => {
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const tokenId = parseTokenId(optionalQueryString(ctx.query, 'tokenId'))
      const numTransactions = wallet.getNumTransactions({ tokenId })
      return { numTransactions }
    }
  )

  /** wallet.saveTxMetadata(opts) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/save-tx-metadata',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const txid = requireString(body, 'txid')
      const tokenId = parseTokenId(
        typeof body.tokenId === 'string' ? body.tokenId : undefined
      )
      if (body.metadata == null || typeof body.metadata !== 'object') {
        throw engineError(
          'BAD_REQUEST',
          'Missing required field "metadata"',
          400
        )
      }
      await wallet.saveTxMetadata({
        txid,
        tokenId,
        metadata: body.metadata as EdgeMetadataChange
      })
      return undefined
    }
  )

  /** wallet.saveTxAction(opts) */
  router.add(
    'POST',
    '/accounts/{sessionId}/wallets/{walletId}/save-tx-action',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
      const txid = requireString(body, 'txid')
      const tokenId = parseTokenId(
        typeof body.tokenId === 'string' ? body.tokenId : undefined
      )
      if (body.savedAction == null || typeof body.savedAction !== 'object') {
        throw engineError(
          'BAD_REQUEST',
          'Missing required field "savedAction"',
          400
        )
      }
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
      return undefined
    }
  )
}
