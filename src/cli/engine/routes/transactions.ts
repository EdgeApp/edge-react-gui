import { asNumber, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction
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
  getTxActionDisplayInfo,
  splitCategory
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
import { TOKEN_ID_DOC } from '../fieldDocs'
import { assertTokenId, findWallet } from '../resolve'
import { route } from '../route'
import {
  asCoreValue,
  asEdgeAssetAction,
  asEdgeMetadataChange,
  asEdgeTxAction,
  asIntegerString,
  asQueryBoolean,
  asQueryDate,
  asQueryNonNegativeInteger,
  asRequestTokenId,
  asWalletId
} from '../schemas'
import { getAccount } from './helpers'

/**
 * Attach the display metadata the GUI shows, plus the structured values it
 * was derived from.
 *
 * Response-only: it does not call `saveTxMetadata`.
 *
 * `metadata.name`, `metadata.category` and `metadata.notes` carry **localized
 * prose**, built from the engine's boot locale — an API layer handing the
 * caller translated text. `displayInfo` is returned beside them so a caller
 * can render its own: `assetActionType` and `direction` are machine values,
 * and `category` is the `EdgeCategory` split, whose `category` member is one
 * of four untranslated tokens where `metadata.category` glues an English
 * prefix to a translated subcategory and can be parsed as neither.
 */
function overlayDisplayMetadata(
  tx: EdgeTransaction,
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): EdgeTransaction & { displayInfo: unknown } {
  const info = getTxActionDisplayInfo(tx, account, wallet)
  return {
    ...fillTxMetadataForDisplay(tx, info.mergedData),
    displayInfo: {
      direction: info.direction,
      iconPluginId: info.iconPluginId,
      assetActionType: info.assetAction?.assetActionType,
      actionType: info.action?.actionType,
      category: splitCategory(info.mergedData.category ?? '')
    }
  }
}

/**
 * `get-transactions` page size when the caller does not ask for one.
 *
 * 99, not 100: the rates batcher stops *before* crossing
 * RATES_SERVER_MAX_QUERY_SIZE, so 99 unpriced transactions cost one upstream
 * request and 100 cost two. The point of the default is that a page prices
 * in a single request, which 100 did not deliver.
 */
const DEFAULT_TX_LIMIT = 99

/**
 * List or export a wallet's transactions.
 *
 * Reads history, overlays the display metadata the GUI shows, fills historical
 * fiat, and optionally formats the result — all on this one call.
 *
 * @note The metadata overlay and the fiat fill are response-only. Neither
 *   writes to disk.
 * @note `limit` and `offset` apply before the fiat fill, so a large page asks
 *   the rates server about more dates. Unpriced dates are batched into one
 *   request per 100, and every rate is cached for the life of the engine, so
 *   a second listing of the same range needs none.
 * @note This is the one GET that can write: passing `bitwaveAccountId`
 *   persists it to `exportTxInfo.json` on the wallet disklet.
 * @returns Without `exportFormat`, the transactions themselves. With it, the
 *   formatted files instead — the two shapes are mutually exclusive.
 */
export const getTransactions = route({
  core: 'wallet.getTransactions',
  coreExtra: {
    limit: 'Engine-side paging; core returns every match.',
    offset: 'Engine-side paging; core returns every match.',
    fiat: 'Selects the currency the engine values each transaction in.',
    exportFormat: 'Engine-side rendering to CSV, QBO or Bitwave.',
    bitwaveAccountId: 'Required by the Bitwave export format.',
    saveExportPrefs:
      'Opt-in write of the wallet\u2019s synced exportTxInfo.json, the record the GUI export scene reads back.'
  },
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
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    limit: asOptional(
      doc(
        asQueryNonNegativeInteger,
        'How many to return. Defaults to 100; pass `0` for every transaction from `offset` on. `total` in the response says how many matched, so a caller can page with `offset`.'
      ),
      DEFAULT_TX_LIMIT
    ),
    offset: asOptional(
      doc(asQueryNonNegativeInteger, 'Where to start. Defaults to 0.'),
      0
    ),
    saveExportPrefs: asOptional(
      doc(
        asQueryBoolean,
        'Save `bitwaveAccountId` and the chosen formats into the wallet\u2019s synced `exportTxInfo.json`, which the GUI export scene reads back. Off by default: a read does not change saved preferences.'
      ),
      false
    ),
    startDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
    endDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
    searchString: asOptional(
      doc(asString, 'Matches payee, category, notes and txid.')
    ),
    spamThreshold: asOptional(
      doc(
        asIntegerString,
        'Native-amount floor. Omitted, the account spam-filter setting applies; a value always overrides it, and `0` shows everything. An empty value reads as omitted, like every other query parameter.'
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
    '`{ transactions, total, isoFiat }`, or `{ ok, isoFiat, total, files }` when exportFormat is set. Each transaction carries `metadata.name`, `metadata.category` and `metadata.notes` as **localized prose** in the engine\u2019s boot locale \u2014 the engine has no per-request locale, so a second shell with a different `LANG` reuses the first engine and gets its language. `displayInfo` beside them carries the machine values the prose was derived from (`direction`, `assetActionType`, `actionType`, and the `category` split whose `category` member is one of `transfer`, `exchange`, `expense`, `income`), so a caller can render its own text.'
  ),
  errors: [
    'BAD_REQUEST',
    'MISSING_BITWAVE_ACCOUNT_ID',
    'TOKEN_NOT_FOUND',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const account = getAccount(ctx)
    const wallet = findWallet(account, ctx.query.valid.walletId)
    const { tokenId, startDate, endDate, searchString, limit, offset } =
      ctx.query.valid
    // `isoFiat` first, and passed in: the default path read and parsed the
    // account's *synced* `Settings.json` twice for the identical answer,
    // once here and once inside `resolveListSpamThreshold` — both through
    // `syncedSettingsFile.readSyncedSettings`, which deliberately has no
    // process-wide cache to absorb the repeat. (The local disklet's file has
    // the same basename, which is the confusion `spamThreshold.ts` warns
    // about; `localAccountSettings` is the one that reads *that*.)
    const fiatRaw = ctx.query.valid.fiat
    let isoFiat: string
    if (fiatRaw != null) {
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

    const spamThreshold = await resolveListSpamThreshold({
      account,
      wallet,
      tokenId,
      isoFiat,
      queryOverride: ctx.query.valid.spamThreshold
    })

    assertTokenId(wallet, tokenId)
    const transactions = await wallet.getTransactions({
      tokenId,
      startDate,
      endDate,
      searchString,
      spamThreshold
    })

    // Parsed before the page is cut, because an export ignores the page.
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

    // `0` is the explicit opt-out. An unbounded default meant one call could
    // price and serialise an entire wallet's history, which on an old BTC or
    // ETH wallet ran past the client's own socket timeout.
    //
    // An export ignores the page entirely. The default was applied *before*
    // the formatters, so `--export-format=csv` wrote a file holding only the
    // first page while the response reported `total` as the real count — a
    // silently truncated accounting export, which is worse than a slow one.
    // The reason the default exists at all is to bound the rates work, and
    // `fillTxsFiat` now queues a whole page in one batch either way.
    const wholeRange = limit === 0 || formats.length > 0
    const sliced = wholeRange
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
        // Persisting is opt-in. This writes `exportTxInfo.json` on the
        // wallet's *synced* disklet, which is the record the GUI's export
        // scene reads back to pre-set its three switches — so doing it
        // unasked turned a one-off `--bitwave-account-id` into the user's
        // saved account id and flipped "Export to Bitwave" on for them.
        if (ctx.query.valid.saveExportPrefs) {
          await mergeExportTxInfo(wallet, tokenId, {
            bitwaveAccountId,
            // The same field set the GUI writes, so one record keeps one
            // meaning: a partial patch left isExportCsv/isExportQbo at
            // `false` on a first write and the record no longer described
            // the last export either tool ran.
            isExportBitwave: formats.includes('bitwave'),
            isExportCsv: formats.includes('csv'),
            isExportQbo: formats.includes('qbo')
          })
        }
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
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null)
  }).withRest,
  returns: asObject({
    numTransactions: doc(asNumber, 'Every transaction the wallet knows of.')
  }),
  errors: ['TOKEN_NOT_FOUND', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const { tokenId } = ctx.query.valid
    assertTokenId(wallet, tokenId)
    // Typed as returning a number, but plugins resolve a promise here, so
    // awaiting is what actually yields a serializable value.
    const numTransactions = await wallet.getNumTransactions({ tokenId })
    return { numTransactions }
  }
})

/**
 * Save transaction metadata.
 *
 * One of the paths that write transaction metadata to disk. The others are
 * `save-tx-action`, which writes `savedAction` and `assetAction` to the same
 * file, and `save-tx` and `spend`, both of which re-apply the caller's
 * metadata through `saveTxAndMetadata` after the transaction is saved.
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
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    metadata: doc(
      asEdgeMetadataChange,
      '`EdgeMetadataChange`: name, category, notes, exchangeAmount, bizId. `null` on a field deletes it; omitting the field leaves it unchanged.'
    )
  }).withRest,
  errors: [
    'BAD_REQUEST',
    'TOKEN_NOT_FOUND',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // Core reads `allTokens[tokenId]` and destructures it, so an unknown
    // token was a `TypeError` — `500 INTERNAL_ERROR` with no field name —
    // where the reference now publishes `TOKEN_NOT_FOUND`.
    assertTokenId(wallet, ctx.body.tokenId)
    await wallet.saveTxMetadata({
      txid: ctx.body.txid,
      tokenId: ctx.body.tokenId,
      metadata: ctx.body.metadata
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
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null),
    savedAction: doc(
      asEdgeTxAction,
      '`EdgeTxAction` describing what happened, discriminated on `actionType`: swap, stake, fiat, tokenApproval or giftCard.'
    ),
    assetAction: asOptional(
      doc(asEdgeAssetAction, '`EdgeAssetAction`: one `assetActionType`.')
    )
  }).withRest,
  errors: [
    'BAD_REQUEST',
    'TOKEN_NOT_FOUND',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    assertTokenId(wallet, ctx.body.tokenId)
    await wallet.saveTxAction({
      txid: ctx.body.txid,
      tokenId: ctx.body.tokenId,
      assetAction: ctx.body.assetAction ?? { assetActionType: 'transfer' },
      savedAction: ctx.body.savedAction
    })
    return undefined
  }
})
