import { asNumber, asObject, asOptional, asString } from 'cleaners'
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
import { doc } from '../doc'
import { engineError } from '../errors'
import { findWallet, parseTokenId } from '../resolve'
import { route } from '../route'
import {
  asCoreValue,
  asQueryDate,
  asQueryInteger,
  asQueryTokenId,
  asTokenId,
  asWalletId
} from '../schemas'
import { getAccount } from './helpers'

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

const TOKEN_ID_DOC = 'Defaults to the native asset.'

/**
 * List or export a wallet's transactions.
 *
 * Reads history, overlays the display metadata the GUI shows, fills historical
 * fiat, and optionally formats the result — all on this one call.
 *
 * @note The metadata overlay and the fiat fill are response-only. Neither
 *   writes to disk.
 * @note `limit` and `offset` apply before the fiat fill, so a large page costs
 *   proportionally more rates-server work.
 * @note This is the one GET that can write: passing `bitwaveAccountId`
 *   persists it to `exportTxInfo.json` on the wallet disklet.
 * @returns Without `exportFormat`, the transactions themselves. With it, the
 *   formatted files instead — the two shapes are mutually exclusive.
 */
export const getTransactions = route({
  core: 'wallet.getTransactions',
  method: 'GET',
  path: '/account/{sessionId}/wallet/get-transactions',
  cli: {
    command: 'get-transactions',
    custom: true,
    flags: { bitwaveAccount: { maps: 'bitwaveAccountId' } },
    extra: {
      out: {
        kind: 'string',
        requiredWith: 'exportFormat',
        doc: 'Where to write the returned files. One format: the path. Several: a stem, plus .csv / .qbo / .bitwave.csv.'
      }
    }
  },
  query: asObject({
    walletId: asWalletId,
    tokenId: asOptional(doc(asQueryTokenId, TOKEN_ID_DOC), null),
    limit: asOptional(
      doc(
        asQueryInteger,
        'Omitting it returns every transaction from `offset` on.'
      )
    ),
    offset: asOptional(
      doc(asQueryInteger, 'Where to start. Defaults to 0.'),
      0
    ),
    startDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
    endDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
    searchString: asOptional(
      doc(asString, 'Matches payee, category, notes and txid.')
    ),
    spamThreshold: asOptional(
      doc(
        asString,
        'Native-amount floor. Omitted, the account spam-filter setting applies; passing it always overrides.'
      )
    ),
    fiat: asOptional(
      doc(
        asString,
        'Three-letter ISO 4217 code. Defaults to the account defaultIsoFiat.'
      )
    ),
    exportFormat: asOptional(
      doc(asString, 'Comma list of `csv`, `qbo`, `bitwave`.')
    ),
    bitwaveAccountId: asOptional(
      doc(asString, 'A 400 unless `exportFormat` includes `bitwave`.')
    )
  }).withRest,
  returns: doc(
    asCoreValue,
    '`{ transactions, total, isoFiat }`, or `{ ok, isoFiat, total, files }` when exportFormat is set.'
  ),
  errors: [
    'BAD_REQUEST',
    'MISSING_BITWAVE_ACCOUNT_ID',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const account = getAccount(ctx)
    const wallet = findWallet(account, ctx.query.valid.walletId)
    const { tokenId, startDate, endDate, searchString, limit, offset } =
      ctx.query.valid
    const spamThreshold = await resolveListSpamThreshold({
      account,
      wallet,
      tokenId,
      queryOverride: ctx.query.valid.spamThreshold
    })

    const fiatRaw = ctx.query.valid.fiat
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

    const exportRaw = ctx.query.valid.exportFormat
    let formats: TxExportFormat[]
    try {
      formats = parseExportFormats(exportRaw)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      throw engineError('BAD_REQUEST', message, 400)
    }

    const bitwaveAccountIdQuery = ctx.query.valid.bitwaveAccountId
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
})

/**
 * Count transactions in a wallet.
 *
 * Cheaper than listing when only the total matters.
 *
 * @note Unfiltered: `spamThreshold`, dates and `searchString` do not apply, so
 *   this can exceed `total` from `get-transactions`.
 */
export const getNumTransactions = route({
  core: 'wallet.getNumTransactions',
  method: 'GET',
  path: '/account/{sessionId}/wallet/get-num-transactions',
  cli: 'get-num-transactions',
  query: asObject({
    walletId: asWalletId,
    tokenId: asOptional(doc(asQueryTokenId, TOKEN_ID_DOC), null)
  }).withRest,
  returns: asObject({
    numTransactions: doc(asNumber, 'Every transaction the wallet knows of.')
  }),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const { tokenId } = ctx.query.valid
    // Typed as returning a number, but plugins resolve a promise here, so
    // awaiting is what actually yields a serializable value.
    const numTransactions = await wallet.getNumTransactions({ tokenId })
    return { numTransactions }
  }
})

/**
 * Save transaction metadata.
 *
 * One of only two routes that write transaction metadata to disk.
 *
 * @note `metadata` is an `EdgeMetadataChange`, so an explicit null clears a
 *   field while an omitted one is left alone.
 */
export const saveTxMetadata = route({
  core: 'wallet.saveTxMetadata',
  method: 'POST',
  path: '/account/{sessionId}/wallet/save-tx-metadata',
  cli: 'save-tx-metadata',
  body: asObject({
    walletId: asWalletId,
    txid: doc(asString, 'Which transaction to tag.'),
    tokenId: asOptional(doc(asTokenId, TOKEN_ID_DOC)),
    metadata: doc(
      asCoreValue,
      '`EdgeMetadataChange`: name, category, notes, exchangeAmount.'
    )
  }).withRest,
  errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    await wallet.saveTxMetadata({
      txid: ctx.body.txid,
      tokenId: parseTokenId(ctx.body.tokenId ?? undefined),
      metadata: ctx.body.metadata as EdgeMetadataChange
    })
    return undefined
  }
})

/**
 * Save a transaction action.
 *
 * Records what a transaction *was* — a swap, a stake — beyond its metadata.
 *
 * @note When `assetAction` is omitted it defaults to
 *   `{ assetActionType: 'transfer' }`.
 */
export const saveTxAction = route({
  core: 'wallet.saveTxAction',
  method: 'POST',
  path: '/account/{sessionId}/wallet/save-tx-action',
  cli: 'save-tx-action',
  body: asObject({
    walletId: asWalletId,
    txid: doc(asString, 'Which transaction to annotate.'),
    tokenId: asOptional(doc(asTokenId, TOKEN_ID_DOC)),
    savedAction: doc(asCoreValue, '`EdgeTxAction` describing what happened.'),
    assetAction: asOptional(doc(asCoreValue, '`EdgeAssetAction`.'))
  }).withRest,
  errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    const assetAction =
      ctx.body.assetAction != null && typeof ctx.body.assetAction === 'object'
        ? (ctx.body.assetAction as EdgeAssetAction)
        : { assetActionType: 'transfer' as const }
    await wallet.saveTxAction({
      txid: ctx.body.txid,
      tokenId: parseTokenId(ctx.body.tokenId ?? undefined),
      assetAction,
      savedAction: ctx.body.savedAction as EdgeTxAction
    })
    return undefined
  }
})
