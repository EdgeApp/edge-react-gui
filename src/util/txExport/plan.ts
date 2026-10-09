/**
 * The two decisions an export makes before it renders anything.
 *
 * Both used to live inline in `TransactionsExportScene.handleSubmit`, which
 * no test can reach — the component is not exported — so the GUI half of the
 * export had the engine's two refusals written a second time with nothing
 * comparing them. The divergence that matters is deliberate and is stated
 * here rather than in one of the two call sites:
 *
 * - **A missing Bitwave account id.** `get-transactions` answers `400
 *   MISSING_BITWAVE_ACCOUNT_ID`, because a REST caller asked for exactly the
 *   formats it named and a file it did not ask for is worse than an error.
 *   The scene drops the format and says so, because the user also ticked CSV
 *   and QBO in the same modal and `buildExportFiles` throwing took all three
 *   away after the whole rate fetch had already run. A cancelled id prompt
 *   is a missing id, not a reason to reuse the saved one.
 * - **Settings that could not be read.** Both halves refuse. The engine's
 *   read throws, and this one reports `settingsUntrusted` with no formats:
 *   `denominationSettings` and `defaultIsoFiat` decide every number and
 *   every label in the file, so there is nothing a warning alongside it
 *   could usefully say.
 * - **Rates the queue gave up on.** `get-transactions` refuses with `503
 *   RATES_INCOMPLETE` and names `--timeout`, which really does raise the
 *   queue's budget. The scene has no such control to offer, and refusing
 *   made a full-history export unobtainable: the budget is shared across the
 *   whole fill, so a restored wallet with nothing priced hit the ceiling
 *   every time and got no file at all, where the old code wrote one. So it
 *   writes the files and reports the count — a `0` fiat amount the user has
 *   been told about is not the silent one the refusal exists to prevent.
 */
import type { FillTxsFiatResult } from '../fillTxsFiat'
import type { TxExportFormat } from './index'

/** Something the user has to be told before they trust the files. */
export type TxExportWarning =
  | { type: 'bitwaveAccountIdMissing' }
  | { type: 'nothingToExport' }
  | { type: 'ratesIncomplete'; unavailable: number; asked: number }
  | { type: 'settingsUntrusted' }

export interface TxExportPlan {
  /** What to hand `buildExportFiles`; empty means stop before any work. */
  formats: TxExportFormat[]
  /** The id those formats will use; `''` when Bitwave is not among them. */
  bitwaveAccountId: string
  /**
   * What to store as the saved id: the submitted value, `''` to clear it,
   * and `undefined` to leave whatever is saved alone.
   *
   * `mergeExportTxInfo` reads every field as `patch.x ?? prev?.x`, so
   * `undefined` keeps the old value and `''` — not being nullish — replaces
   * it. That is why a cleared field could not be cleared: the scene turned
   * every empty answer into `undefined`, so the old id survived a user
   * deliberately emptying the box.
   */
  savedAccountIdPatch: string | undefined
  warnings: TxExportWarning[]
}

/**
 * Which formats to render, with which Bitwave id, and what to say about it —
 * everything decidable before the transactions are read.
 *
 * Before, because both refusals depend only on what the scene already has
 * when Export is pressed, and the rate fetch behind them can take minutes:
 * deciding afterwards made the user wait through the whole fill, priced in
 * a fiat the plan then threw away, to be told no file would be written.
 * The one judgement that needs the fill is `ratesIncompleteWarning` below.
 *
 * CSV is always rendered whether or not it was ticked: `buildExportFiles`
 * relies on it to decide whether the date range is empty, and that check has
 * to run for every combination the user picked.
 */
export function planTxExport(opts: {
  wantCsv: boolean
  wantQbo: boolean
  wantBitwave: boolean
  /**
   * What the id modal returned: `undefined` for a cancel, the trimmed text
   * for a submit, and absent when the modal was never shown.
   *
   * Three states rather than one string, because the modal is *pre-filled*
   * from the saved id — so a submit already carries it and there is nothing
   * to fall back to. Falling back anyway is what made a cancel mean "use
   * the old one": a user who turned Bitwave on, saw an id naming the wrong
   * ledger account, and cancelled got an export that went ahead and wrote
   * that stale id on every row of the `.bitwave.csv` — the field Bitwave
   * attributes transactions by — and the only toast fired precisely when
   * the id had *not* been used.
   */
  modalAccountId?: string
  /**
   * Whether the synced settings the numbers are derived from are the user's.
   *
   * `false` means the account's `Settings.json` could not be read at login,
   * so `denominationSettings` is `{}` and `defaultIsoFiat` is `'iso:USD'` —
   * the cleaner's defaults, indistinguishable from an account that has
   * chosen nothing. Every amount in the file would then be divided by the
   * exchange denomination rather than the user's unit, and every row
   * labelled in a fiat they may not use. `get-transactions --export-format`
   * refuses on exactly this; so does the scene. Required, so a second
   * caller cannot get a plan that silently skips the refusal.
   */
  syncedSettingsTrusted: boolean
}): TxExportPlan {
  const { wantCsv, wantQbo, wantBitwave, modalAccountId } = opts

  // No formats at all, so the caller writes nothing. A wrong unit and a
  // wrong fiat label are not something a warning beside the file can
  // repair — the numbers in it are wrong.
  if (!opts.syncedSettingsTrusted) {
    return {
      formats: [],
      bitwaveAccountId: '',
      savedAccountIdPatch: undefined,
      warnings: [{ type: 'settingsUntrusted' }]
    }
  }

  const bitwaveAccountId = modalAccountId ?? ''
  const includeBitwave = wantBitwave && bitwaveAccountId !== ''
  // A cancel says nothing about the id, so it keeps what is saved. A
  // submitted empty field is the user clearing it, which `''` does.
  const savedAccountIdPatch = wantBitwave ? modalAccountId : undefined

  // Bitwave was the only format ticked and it has no id: nothing the user
  // asked for survives, so say that rather than "the Bitwave CSV was
  // skipped" followed by an empty export.
  if (!wantCsv && !wantQbo && !includeBitwave) {
    return {
      formats: [],
      bitwaveAccountId: '',
      savedAccountIdPatch,
      warnings: wantBitwave ? [{ type: 'nothingToExport' }] : []
    }
  }

  const warnings: TxExportWarning[] = []
  if (wantBitwave && !includeBitwave) {
    warnings.push({ type: 'bitwaveAccountIdMissing' })
  }

  return {
    formats: [
      'csv',
      ...(wantQbo ? (['qbo'] as const) : []),
      ...(includeBitwave ? (['bitwave'] as const) : [])
    ],
    bitwaveAccountId: includeBitwave ? bitwaveAccountId : '',
    savedAccountIdPatch,
    warnings
  }
}

/**
 * The one judgement that needs the fill: rows the queue could not price.
 *
 * The files are still written — see the module docblock — so this is what
 * the user must read before trusting their fiat column.
 */
export function ratesIncompleteWarning(
  fill: FillTxsFiatResult
): TxExportWarning | undefined {
  if (fill.unavailable === 0) return undefined
  return {
    type: 'ratesIncomplete',
    unavailable: fill.unavailable,
    asked: fill.asked
  }
}
