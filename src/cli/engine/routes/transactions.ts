import {
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction
} from 'edge-core-js'

import { getDisplayDenom, getExchangeDenom } from '../../../util/exchangeDenom'
import {
  exportTxInfoKey,
  mergeExportTxInfo,
  readExportTxInfoMap
} from '../../../util/exportTxInfo'
import { toIsoFiatCode } from '../../../util/fiatCode'
import { fillTxsFiat } from '../../../util/fillTxsFiat'
import { isMissingFile } from '../../../util/predicates'
import {
  defaultIsoFiatOf,
  resolveListSpamThreshold
} from '../../../util/spamThreshold'
import { readSyncedSettingsOrThrow } from '../../../util/syncedSettingsFile'
import {
  currencyCodeForToken,
  fillTxMetadataForDisplay,
  getTxActionDisplayInfo,
  splitCategory
} from '../../../util/txDisplay'
import {
  buildExportFiles,
  parseExportFormats,
  type TxExportFormat
} from '../../../util/txExport'
import { readRequestBudgetMs } from '../../requestBudget'
import { doc } from '../doc'
import { engineError, errorMessage } from '../errors'
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
export const DEFAULT_TX_LIMIT = 99

/**
 * List or export a wallet's transactions.
 *
 * Reads history, overlays the display metadata the GUI shows, fills historical
 * fiat, and optionally formats the result — all on this one call.
 *
 * @note The metadata overlay and the fiat fill are response-only. Neither
 *   writes to disk.
 * @note `limit` and `offset` apply before the fiat fill, so a large page asks
 *   the rates server about more dates. Unpriced dates are batched at up to 99
 *   per request — the batcher stops before the server's 100-asset limit,
 *   which is why `DEFAULT_TX_LIMIT` is 99 — and every rate is cached until
 *   the last session logs out, so a second listing of the same range within
 *   one login needs none.
 * @note An export ignores `limit` and `offset` entirely. Paging an export is
 *   the obvious way to get a 50,000-transaction wallet out, and it would
 *   write a file holding one page while the response reported `total` as the
 *   real count — a silently truncated accounting export.
 * @note This is the one GET that can write, and only with `saveExportPrefs`:
 *   that flag persists `bitwaveAccountId` *and* the chosen formats into
 *   `exportTxInfo.json` on the wallet disklet. `bitwaveAccountId` on its own
 *   persists nothing, so a one-off export does not become the caller's saved
 *   account id.
 * @note An export is unfiltered. The account spam-filter setting applies to
 *   a listing, the way the GUI's transaction list applies it, and not to an
 *   `exportFormat` export, the way the GUI's Export button does not —
 *   dropping rows from an accounting export is not a display convenience.
 *   An explicit `spamThreshold` applies to both.
 * @note An export of a range with no transactions in it succeeds and writes
 *   an empty CSV — no header row, zero bytes. The CSV exporter takes its
 *   column names from the first record, so with no records there is no
 *   header to write, and an empty range is a successful export of nothing
 *   rather than a failure. QBO differs because its envelope does not depend
 *   on the records, so `--export-format=csv,qbo` over an empty range writes
 *   one empty file and one with only an envelope in it.
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
        // The number has to match `DEFAULT_TX_LIMIT`, and a template literal
        // cannot say so: `extractRoutes` reads this through the checker as a
        // string *literal*, and interpolating dropped the description from
        // the reference altogether. `derivedNumbers.test.ts` asserts the two
        // agree instead.
        'How many to return. Defaults to 99; pass `0` for every transaction from `offset` on. `total` in the response says how many matched, so a caller can page with `offset`. Ignored by an `exportFormat` export, which always covers the whole match.'
      ),
      DEFAULT_TX_LIMIT
    ),
    offset: asOptional(
      doc(
        asQueryNonNegativeInteger,
        'Where to start. Defaults to 0. Ignored by an `exportFormat` export, like `limit`.'
      ),
      0
    ),
    saveExportPrefs: asOptional(
      doc(
        asQueryBoolean,
        'Save `bitwaveAccountId` and the chosen formats into the wallet\u2019s synced `exportTxInfo.json`, which the GUI export scene reads back; `export-prefs` reads it. Off by default: a read does not change saved preferences. A `400` without `exportFormat`, because what is saved *is* the chosen formats \u2014 on a listing there would be nothing to write, and answering `ok` for that told a caller their preferences had been recorded when they had not.'
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
        'Native-amount floor. Omitted, the account spam-filter setting applies to a listing and nothing is filtered from an `exportFormat` export; a value always overrides both, and `0` shows everything. An empty value reads as omitted, like every other query parameter.'
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
    '`{ transactions, total, isoFiat, unpricedCount }`, or `{ ok, isoFiat, total, files }` when exportFormat is set. `unpricedCount` is how many of the returned transactions the rates queue gave up on rather than priced — their `metadata.exchangeAmount` is left as it was instead of being written as `0`; an export refuses with `RATES_INCOMPLETE` in that case rather than writing a file with a zero fiat amount in part of the range. Each transaction carries `metadata.name`, `metadata.category` and `metadata.notes` as **localized prose** in the engine\u2019s boot locale \u2014 the engine has no per-request locale, so a second shell with a different `LANG` reuses the first engine and gets its language. `displayInfo` beside them carries the machine values the prose was derived from (`direction`, `assetActionType`, `actionType`, and the `category` split whose `category` member is one of `transfer`, `exchange`, `expense`, `income`), so a caller can render its own text.'
  ),
  errors: [
    'BAD_REQUEST',
    'MISSING_BITWAVE_ACCOUNT_ID',
    'RATES_INCOMPLETE',
    'TOKEN_NOT_FOUND',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const account = getAccount(ctx)
    const wallet = findWallet(account, ctx.query.valid.walletId)
    const { tokenId, startDate, endDate, searchString, limit, offset } =
      ctx.query.valid
    // The account's own fiat, read once and spent twice. It is the floor's
    // currency and the display default, and the two values are the same by
    // construction whenever `fiat` was not given — so reading it per use
    // parsed the account's *synced* `Settings.json` twice for the identical
    // answer, through `syncedSettingsFile.readSyncedSettings`, which
    // deliberately has no process-wide cache to absorb the repeat. (The
    // local disklet's file has the same basename, which is the confusion
    // `spamThreshold.ts` warns about; `localAccountSettings` is the one that
    // reads *that*.) The export path below wants `denominationSettings` out
    // of the same file, so it takes them from this one read too.
    // `fakeDisklet`'s `onSyncedRead` counts the reads, and
    // `getTransactions.test.ts` pins the count.
    //
    // The spam floor is denominated in the account's fiat, never the one the
    // caller asked to see amounts in. `calculateSpamThreshold` divides a
    // multiplier by a rate, so passing the display fiat moved the floor:
    // `--fiat=JPY` on a BTC wallet truncated it to `'0'` — the account's
    // spam filter silently off — and on a cheap ERC-20 it moved it by orders
    // of magnitude, so two listings of one range returned different rows and
    // different `total`s depending on the display currency. `fiat` is
    // documented as display-only, and the GUI's list filters by the
    // account's own setting.
    const syncedSettings = await readSyncedSettingsOrThrow(account)
    const thresholdIsoFiat = defaultIsoFiatOf(syncedSettings)

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
      isoFiat = thresholdIsoFiat
    }

    // Parsed before the page is cut and before the spam floor is resolved,
    // because an export ignores the page and takes no floor.
    const exportRaw = ctx.query.valid.exportFormat
    let formats: TxExportFormat[]
    try {
      formats = parseExportFormats(exportRaw)
    } catch (error: unknown) {
      const message = errorMessage(error)
      throw engineError('BAD_REQUEST', message, 400)
    }

    // An export is not a listing. Spam filtering is a display convenience —
    // the GUI's transaction list applies it and the GUI's Export button
    // deliberately does not — and `spamFilterOn` defaults to `true`, so an
    // account that has received dust exported a smaller row count here than
    // from the scene over the same dates, with `total` reporting the
    // filtered count as the whole range. Nobody asked for rows to be dropped
    // from an accounting export; a caller who wants the floor can still pass
    // `spamThreshold` and gets exactly what they asked for.
    const exporting = formats.length > 0
    const queryThreshold = ctx.query.valid.spamThreshold
    const spamThreshold =
      exporting && queryThreshold == null
        ? '0'
        : await resolveListSpamThreshold({
            account,
            wallet,
            tokenId,
            isoFiat: thresholdIsoFiat,
            queryOverride: queryThreshold,
            onWarn: message => {
              ctx.state.logger.warn(message)
            }
          })

    assertTokenId(wallet, tokenId)
    const transactions = await wallet.getTransactions({
      tokenId,
      startDate,
      endDate,
      searchString,
      spamThreshold
    })

    const bitwaveAccountIdQuery = ctx.query.valid.bitwaveAccountId
    if (bitwaveAccountIdQuery != null && !formats.includes('bitwave')) {
      throw engineError(
        'BAD_REQUEST',
        'Query "bitwaveAccountId" requires exportFormat to include bitwave',
        400
      )
    }
    // The symmetrical refusal. The write lives in the export arm, which this
    // handler returns before reaching when no format was asked for — so
    // `--save-export-prefs` on a listing answered `ok` with a normal page
    // and recorded nothing, and a caller had no way to know. It is the same
    // argument as the line above, and the same one that made an unknown
    // token id and an unknown voucher id refusals rather than successes.
    // `--export-format=,` lands here too: an empty list is no formats.
    if (ctx.query.valid.saveExportPrefs && formats.length === 0) {
      throw engineError(
        'BAD_REQUEST',
        'Query "saveExportPrefs" requires exportFormat: the preferences ' +
          'saved are the chosen formats and the Bitwave account id, so ' +
          'there is nothing to save for a listing.',
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
    // An export ignores the page *entirely*, `offset` included. Ignoring only
    // `limit` left `--export-format=csv --offset=100` writing a file with the
    // newest hundred transactions missing while the response reported `total`
    // as the real count — the silently truncated accounting export this
    // paragraph says is worse than a slow one, through the other half of the
    // page.
    const sliced = exporting
      ? transactions
      : limit === 0
      ? transactions.slice(offset)
      : transactions.slice(offset, offset + limit)

    const overlayed = sliced.map(tx =>
      overlayDisplayMetadata(tx, account, wallet)
    )
    // The caller's own deadline, not a module constant. `RATE_CHAIN_TIMEOUT_MS`
    // ends the unbounded wait, and it ends it by settling the remainder —
    // which on this route is an arbitrary tail of the oldest transactions.
    // `doQuery` carries at most 99 keys a pass, so a 1,200-transaction
    // export is 13 passes and a 10,000-transaction one is 102, and a server
    // answering in ~700 ms spends 90 s before they finish. `--timeout` moved
    // `apiClient`'s deadline and nothing moved this, so the one control the
    // route offers for "slow is better than wrong" had no effect on the work
    // it was waiting for.
    const fill = await fillTxsFiat({
      wallet,
      tokenId,
      isoFiat,
      txs: overlayed,
      // The client sends its own `--timeout`; a request without the header
      // falls back to the module constant, which is what every direct REST
      // caller gets.
      chainTimeoutMs: readRequestBudgetMs(ctx.req, ctx.arrivedAt)
    })

    if (formats.length === 0) {
      return {
        transactions: overlayed,
        total: transactions.length,
        isoFiat,
        // Published, so a listing says what it could not price rather than
        // answering `0` for it. An export refuses instead; see below.
        unpricedCount: fill.unavailable
      }
    }

    // An export is a file a person reconciles against their books, and a
    // zero fiat amount in it is indistinguishable from a real one. The
    // queue's "gave up" answer is now distinct from "the server cannot
    // price this date" — the first is this refusal, the second is a `0` the
    // server itself supplied — so the export stops instead of writing a
    // number nobody asked for. `details` says how much, and the message
    // names the two ways out.
    if (fill.unavailable > 0) {
      throw engineError(
        'RATES_INCOMPLETE',
        `${fill.unavailable} of ${fill.asked} transactions could not be ` +
          'priced, so this export would carry a zero fiat amount for part ' +
          'of the range. Raise --timeout, which raises the rate queue\u2019s ' +
          'own budget with it, or narrow the date range.',
        503,
        { asked: fill.asked, unavailable: fill.unavailable }
      )
    }

    // The *display* denomination, which is what the GUI's export writes into
    // its CSV and QBO files: `selectDisplayDenom` reads the user's choice out
    // of Redux and this reads the same `denominationSettings` out of the
    // synced `Settings.json`, through one shared derivation. With only the
    // exchange denomination, a BTC wallet set to "bits" exported
    // `AMT_ASSET=50000` with `DENOMINATION=bits` from the scene and `0.0005`
    // with `BTC` from here, for the same transaction — and QBO's `TRNAMT`
    // carries no unit field at all to tell the two files apart.
    // From the one read at the top, which is the strict one: an empty
    // `denominationSettings` sends `getDisplayDenom` to the exchange
    // denomination, which is the divisor this export was just taught not to
    // guess, so a file that is there and unreadable must not look like an
    // account that has chosen nothing — and it does not, because that read
    // throws.
    const { denominationSettings } = syncedSettings
    // Two denominations, because the three formats want different ones and
    // the scene already spends them that way. CSV and QBO carry the amount
    // beside a unit — CSV in its `DENOMINATION` column, QBO implicitly, both
    // from the user's chosen display units — while Bitwave has no unit field
    // at all: `amountTicker` is the asset's own currency code, so its
    // `amount` has to be in the *exchange* denomination or the row reads
    // `50000 BTC` for 0.0005 BTC. Feeding one denomination to all three
    // aligned CSV and QBO and broke the one format that already agreed.
    const displayDenom = getDisplayDenom(
      denominationSettings,
      wallet.currencyConfig,
      tokenId
    )
    const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    // The shared body, not a third derivation: this one answered the raw
    // `tokenId` for a token the plugin no longer carries, where the GUI
    // answers `''`, so one export named a column after a contract address.
    // (`assertTokenId` above means neither arm is reachable today, which is
    // exactly when a copy drifts unnoticed.)
    const currencyCode = currencyCodeForToken(wallet, tokenId)

    let bitwaveAccountId: string | undefined
    if (formats.includes('bitwave')) {
      if (bitwaveAccountIdQuery != null && bitwaveAccountIdQuery !== '') {
        bitwaveAccountId = bitwaveAccountIdQuery
      } else {
        let saved: string | undefined
        try {
          const map = await readExportTxInfoMap(wallet)
          saved = map[exportTxInfoKey(wallet, tokenId)]?.bitwaveAccountId
        } catch (error: unknown) {
          // Only an absent file is "no saved id". This caught everything, so
          // an `exportTxInfo.json` that would not decrypt answered
          // `400 MISSING_BITWAVE_ACCOUNT_ID` — telling the caller their
          // saved id is not there when it is, with nothing logged. The write
          // half of this same request rethrows, and `mergeExportTxInfo`
          // refuses to treat an unreadable file as absent for the same
          // reason.
          if (!isMissingFile(error)) throw error
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

    // Outside the bitwave branches, because the flag is documented as saving
    // "`bitwaveAccountId` **and** the chosen formats" and it used to be
    // honoured only when the caller asked for bitwave *and* passed an
    // explicit account id. So `--export-format=csv,qbo --save-export-prefs`
    // answered `ok` and wrote nothing, leaving the GUI export scene's
    // switches untouched. Persisting is still opt-in: writing unasked turned
    // a one-off `--bitwave-account-id` into the user's saved account id and
    // flipped "Export to Bitwave" on for them.
    if (ctx.query.valid.saveExportPrefs) {
      await mergeExportTxInfo(wallet, tokenId, {
        // Safe to pass when absent: `mergeExportTxInfo` reads every field as
        // `patch.x ?? prev?.x`, so an undefined id keeps whatever was saved
        // rather than clearing it for a caller who never mentioned bitwave.
        bitwaveAccountId,
        // The same field set the GUI writes, so one record keeps one
        // meaning: a partial patch left isExportCsv/isExportQbo at `false`
        // on a first write and the record no longer described the last
        // export either tool ran.
        isExportBitwave: formats.includes('bitwave'),
        isExportCsv: formats.includes('csv'),
        isExportQbo: formats.includes('qbo')
      })
    }

    // One dispatch, shared with the GUI's export scene. This was an
    // `if/else if/else` over `formats` and the scene had three `if` blocks,
    // and four rounds of review found the two disagreeing about which
    // resolved value went to which formatter. The `else` arm compounded it:
    // a fourth entry in `TX_EXPORT_FORMATS` is accepted by
    // `asTxExportFormat` everywhere, fell in here, and dereferenced
    // `bitwaveAccountId!` as `undefined`.
    const files = await buildExportFiles({
      formats,
      txs: overlayed,
      currencyCode,
      isoFiat,
      displayDenom,
      exchangeDenom,
      bitwaveAccountId
    })

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
 * Read a wallet's saved export preferences.
 *
 * The record the GUI's export scene reads back, and the one
 * `get-transactions --save-export-prefs` writes: the saved Bitwave account
 * id and which of the three formats were last chosen. It is keyed per asset,
 * so a token and its chain's own coin keep separate records.
 *
 * @note This exists because the write did not have a reader. The CLI could
 *   put a record into a *synced* file the GUI reads and offer no way to see
 *   what it had written, so the one write a `GET` makes could be observed
 *   only from the app — which also made it the one write QA could not
 *   verify or restore on a shared account.
 * @note A saved `bitwaveAccountId` can be overwritten, by exporting again
 *   with `--bitwave-account` and `--save-export-prefs`, but not cleared:
 *   `mergeExportTxInfo` keeps a previous value for a field the caller does
 *   not name, which is what stops a CSV export from wiping a saved id.
 *   Clearing one is the export scene's job.
 * @coreNote GUI code (src/util/exportTxInfo), reached through
 *   wallet.disklet.
 */
export const exportPrefs = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/wallet/export-prefs',
  cli: 'export-prefs',
  query: asObject({
    walletId: asWalletId,
    tokenId: asOptional(doc(asRequestTokenId, TOKEN_ID_DOC), null)
  }).withRest,
  returns: asObject({
    key: doc(
      asString,
      'The record’s key in `exportTxInfo.json`: the `tokenId`, or the chain’s own currency code for the native asset. The GUI uses the same key.'
    ),
    prefs: doc(
      asEither(asCoreValue, asValue(null)),
      'The saved record — `bitwaveAccountId`, `isExportCsv`, `isExportQbo`, `isExportBitwave` — or null when this asset has none, which is the state of every wallet until something saves one.'
    )
  }),
  errors: ['TOKEN_NOT_FOUND', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    const { tokenId } = ctx.query.valid
    assertTokenId(wallet, tokenId)
    const key = exportTxInfoKey(wallet, tokenId)
    let prefs = null
    try {
      prefs = (await readExportTxInfoMap(wallet))[key] ?? null
    } catch (error: unknown) {
      // Only an absent file is "nothing saved". A file that is there and
      // will not decrypt is a failure, for the reason the export arm gives:
      // answering `null` would tell a caller their saved id is not there
      // when it is.
      if (!isMissingFile(error)) throw error
    }
    return { key, prefs }
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
      '`EdgeTxAction` describing what happened, discriminated on `actionType`: one of swap, swapSend, stake, fiat, tokenApproval or giftCard.'
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
