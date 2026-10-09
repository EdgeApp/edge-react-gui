import { describe, expect, it } from '@jest/globals'

import {
  RATE_CHAIN_BUDGET_MAX_MS,
  RATE_CHAIN_TIMEOUT_MS,
  RATE_QUERY_TIMEOUT_MS,
  rateChainBudgetMs
} from '../../util/exchangeRates'
import { planTxExport, ratesIncompleteWarning } from '../../util/txExport/plan'

/** The scene's defaults: CSV ticked, settings read at login. */
const base = {
  wantCsv: true,
  wantQbo: false,
  wantBitwave: false,
  syncedSettingsTrusted: true
}

/**
 * The export scene's judgement calls, which no test could reach.
 *
 * `TransactionsExportScene` is not exported, so `handleSubmit` had the
 * engine's two refusals written a second time with nothing comparing them —
 * and four rounds of review found the two sides disagreeing about what each
 * formatter gets. These are the decisions, lifted out whole, and the scene
 * makes them before it reads a single transaction.
 */
describe('planTxExport', () => {
  it('always renders CSV, because the empty-range check needs it', () => {
    const plan = planTxExport({ ...base, wantCsv: false, wantQbo: true })
    expect(plan.formats).toStrictEqual(['csv', 'qbo'])
    expect(plan.warnings).toStrictEqual([])
    expect(plan.bitwaveAccountId).toBe('')
  })

  it('adds the formats the user ticked', () => {
    const plan = planTxExport({
      ...base,
      wantQbo: true,
      wantBitwave: true,
      modalAccountId: 'acct-1'
    })
    expect(plan.formats).toStrictEqual(['csv', 'qbo', 'bitwave'])
    expect(plan.bitwaveAccountId).toBe('acct-1')
    expect(plan.savedAccountIdPatch).toBe('acct-1')
  })

  it('drops Bitwave when the id prompt was cancelled', () => {
    // The modal is pre-filled from the saved id, so falling back to it made
    // a cancel mean "use the old one": a user who turned Bitwave on, saw an
    // id naming the wrong ledger account and cancelled got an export that
    // went ahead and wrote that stale id on every row of the
    // `.bitwave.csv` — the field Bitwave attributes transactions by — and
    // the only toast fired precisely when the id had *not* been used.
    const plan = planTxExport({
      ...base,
      wantBitwave: true,
      modalAccountId: undefined
    })
    expect(plan.formats).toStrictEqual(['csv'])
    expect(plan.bitwaveAccountId).toBe('')
    expect(plan.warnings).toStrictEqual([{ type: 'bitwaveAccountIdMissing' }])
    // And a cancel says nothing about the saved id, so it stays.
    expect(plan.savedAccountIdPatch).toBeUndefined()
  })

  it('clears the saved id when the field was submitted empty', () => {
    // `mergeExportTxInfo` reads `patch.x ?? prev?.x`, so `''` replaces and
    // `undefined` keeps. The scene turned both into `undefined`, so a user
    // deliberately emptying the box could not clear the saved id. The scene
    // writes exactly this patch.
    const plan = planTxExport({
      ...base,
      wantBitwave: true,
      modalAccountId: ''
    })
    expect(plan.formats).toStrictEqual(['csv'])
    expect(plan.savedAccountIdPatch).toBe('')
    expect(plan.warnings).toStrictEqual([{ type: 'bitwaveAccountIdMissing' }])
  })

  it('leaves the saved id alone when Bitwave was not asked for', () => {
    const plan = planTxExport({ ...base, wantQbo: true })
    expect(plan.savedAccountIdPatch).toBeUndefined()
  })

  it('drops Bitwave and keeps the rest when no id can be found', () => {
    // `buildExportFiles` throws for `'bitwave'` without an id, and that
    // throw escaped `handleSubmit` after the whole rate fetch had run — so
    // the user waited, got an error drop-down, and lost the CSV and QBO
    // they had ticked in the same modal.
    const plan = planTxExport({
      ...base,
      wantQbo: true,
      wantBitwave: true,
      modalAccountId: undefined
    })
    expect(plan.formats).toStrictEqual(['csv', 'qbo'])
    expect(plan.bitwaveAccountId).toBe('')
    expect(plan.warnings).toStrictEqual([{ type: 'bitwaveAccountIdMissing' }])
  })

  it('stops before any work when nothing the user ticked survives', () => {
    // Bitwave alone, with no id. The CSV is built but not wanted, so the
    // scene used to fetch every rate, skip every file and then say "No
    // transactions in the date range chosen" — false, right after a toast
    // saying the Bitwave CSV was skipped.
    for (const modalAccountId of [undefined, '']) {
      const plan = planTxExport({
        ...base,
        wantCsv: false,
        wantBitwave: true,
        modalAccountId
      })
      expect(plan.formats).toStrictEqual([])
      expect(plan.warnings).toStrictEqual([{ type: 'nothingToExport' }])
      expect(plan.savedAccountIdPatch).toBe(modalAccountId)
    }
  })

  it('refuses outright when the synced settings could not be read', () => {
    // `state.ui.settings.denominationSettings` and `.defaultIsoFiat` are
    // filled once at login by the lenient reader, so a `Settings.json` that
    // was unreadable then put `{}` and `'iso:USD'` there — which the export
    // derivation cannot tell from an account that has chosen nothing. A BTC
    // wallet set to `bits` then exported `0.0005` and `DENOMINATION=BTC`
    // instead of `50000` and `bits`, priced and labelled `iso:USD`, with
    // nothing shown — while the engine's export refuses on the same file.
    // No formats, because a wrong unit and a wrong fiat label are not
    // something a warning beside the file can repair.
    const plan = planTxExport({
      ...base,
      wantQbo: true,
      wantBitwave: true,
      modalAccountId: 'acct-1',
      syncedSettingsTrusted: false
    })
    expect(plan.formats).toStrictEqual([])
    expect(plan.bitwaveAccountId).toBe('')
    expect(plan.savedAccountIdPatch).toBeUndefined()
    expect(plan.warnings).toStrictEqual([{ type: 'settingsUntrusted' }])
  })
})

/** The one judgement that needs the fill. */
describe('ratesIncompleteWarning', () => {
  it('reports unpriced rates, and the files are still written', () => {
    // Refusing here made a full-history export unobtainable: the fill shares
    // one budget, so a restored wallet with nothing priced hit the ceiling
    // every time and got no file at all, where the old code wrote one. The
    // engine refuses because its caller can raise `--timeout`; the scene has
    // nothing to offer, so it says what the fiat column is missing.
    expect(
      ratesIncompleteWarning({ asked: 900, unavailable: 118 })
    ).toStrictEqual({ type: 'ratesIncomplete', unavailable: 118, asked: 900 })
  })

  it('says nothing when every row was priced', () => {
    expect(
      ratesIncompleteWarning({ asked: 12, unavailable: 0 })
    ).toBeUndefined()
  })
})

/**
 * The budget the GUI had no way to raise.
 *
 * `RATE_CHAIN_TIMEOUT_MS` is one number for every caller, and the whole fill
 * shares it: `doQuery` recurses once per batch of 100, so a
 * 10,000-transaction export is 102 passes and the fixed 90 s is spent long
 * before they finish. Every unsettled key is then `RATE_UNAVAILABLE`.
 */
describe('rateChainBudgetMs', () => {
  it('keeps today’s floor for a small fill', () => {
    expect(rateChainBudgetMs(0)).toBe(RATE_CHAIN_TIMEOUT_MS)
    expect(rateChainBudgetMs(1)).toBe(RATE_CHAIN_TIMEOUT_MS)
    expect(rateChainBudgetMs(100)).toBe(RATE_CHAIN_TIMEOUT_MS)
    // Three passes is 90 s exactly, which is where the floor stops binding.
    expect(rateChainBudgetMs(300)).toBe(RATE_CHAIN_TIMEOUT_MS)
  })

  it('scales with the batches the keys will take', () => {
    // The case `fillTxsFiat`'s docblock cites: 1,200 unpriced transactions,
    // 12 passes, 360 s of worst case where the fixed budget allowed 90 s for
    // the lot.
    expect(rateChainBudgetMs(1200)).toBe(12 * RATE_QUERY_TIMEOUT_MS)
    expect(rateChainBudgetMs(1200)).toBeGreaterThan(RATE_CHAIN_TIMEOUT_MS)
    expect(rateChainBudgetMs(301)).toBe(4 * RATE_QUERY_TIMEOUT_MS)
  })

  it('stops at the ceiling, because someone is watching a spinner', () => {
    // The arithmetic is a worst case — every pass taking its full 30 s —
    // and the finding's 10,000-transaction export would scale to 50 minutes
    // of it. The realistic cost is the one `exchangeRates.ts` works out, a
    // server answering in ~700 ms plus the per-batch debounce: ~175 s for
    // those 102 passes, which the ceiling still covers three times over.
    // Past it the fill reports what it could not price, which the scene now
    // shows rather than refusing.
    expect(rateChainBudgetMs(10_000)).toBe(RATE_CHAIN_BUDGET_MAX_MS)
    expect(rateChainBudgetMs(5_000_000)).toBe(RATE_CHAIN_BUDGET_MAX_MS)
  })
})
