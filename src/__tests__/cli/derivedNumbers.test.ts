import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { DEFAULT_TIMEOUT_MS } from '../../cli/client/apiClient'
import { DEFAULT_TX_LIMIT } from '../../cli/engine/routes/transactions'
import { MAX_TIMER_MS, TX_ACTION_TYPES } from '../../cli/engine/schemas'
import { DISABLED_RECHECK_MS } from '../../cli/engine/sessions'
import {
  CORE_TEARDOWN_WAIT_MS,
  HANDLE_BUSY_WAIT_MS,
  HANDLE_TEARDOWN_WAIT_MS,
  LISTENER_CLOSE_WAIT_MS,
  LOGOUT_WAIT_MS,
  SHUTDOWN_DRAIN_MS,
  SHUTDOWN_WAIT_MS
} from '../../cli/engine/shutdownTiming'
import { SWEEP_INTERVAL_MS } from '../../cli/engine/sweepTicker'
import helpDocs from '../../cli/generated/helpDocs.json'
import { asHelpDocs } from '../../cli/generatedSchemas'
import {
  RATE_CHAIN_TIMEOUT_MS,
  RATE_QUERY_TIMEOUT_MS
} from '../../util/exchangeRates'
import { TX_EXPORT_FORMAT_INFO, TX_EXPORT_SUFFIXES } from '../../util/txExport'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * The published default page size must be the one the route actually uses.
 *
 * They disagreed: the description said 100 while `DEFAULT_TX_LIMIT` is 99,
 * deliberately, so the rates batcher stops before crossing its 100-asset
 * limit. The wrong number reaches `openapi.json`, the HTML reference and
 * `edge-cli help get-transactions`, so a caller paging on the documented
 * default walks `offset` 0, 100, 200 and skips one transaction per page —
 * and `total` does not reveal it, because `total` is the match count, not
 * the page size. An accounting export built that way is short and looks
 * complete.
 *
 * The description cannot interpolate the constant: `extractRoutes` reads it
 * through the TypeScript checker as a string literal, and a template literal
 * drops it from the reference entirely. So the two are kept in step here.
 */
describe('get-transactions limit', () => {
  it('publishes the default the route actually applies', () => {
    const limit =
      asHelpDocs(helpDocs).commands['get-transactions'].params?.limit
    expect(limit).not.toBeUndefined()
    const prose = limit?.doc ?? ''
    expect(prose).toContain(`Defaults to ${DEFAULT_TX_LIMIT}`)
  })

  it('publishes the timer ceiling the parsers actually enforce', () => {
    // Both ceilings are refusals a caller runs into, and neither was
    // written down: the guide's `--idle-timeout` row stopped at "`0` means
    // never" and `admin-make-lobby`'s `period` doc stated a floor, which
    // reads as there being no ceiling. The number cannot be interpolated
    // into either — `extractRoutes` reads a field doc through the checker as
    // a string literal, and the guide is prose — so the two are kept in
    // step here, against `MAX_TIMER_MS` itself.
    const seconds = String(Math.floor(MAX_TIMER_MS / 1000))
    const guide = fs.readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')
    expect(guide).toContain(seconds)
    const period =
      asHelpDocs(helpDocs).commands['admin-make-lobby'].params?.period
    expect(period?.doc ?? '').toContain(seconds)
    const timeout = asHelpDocs(helpDocs).commands['enable-otp'].params?.timeout
    expect(timeout?.doc ?? '').toContain(seconds)
  })

  it('publishes the auto-logout re-read cadence it actually runs', () => {
    // The guide states a timing contract — "within 15 seconds normally, and
    // within a minute for a session whose auto-logout is currently off" —
    // and auto-logout is a security control, so a session whose window the
    // user *shortened* on another device living longer than the account
    // says it may is the direction that matters. It cannot be driven live:
    // nothing in the CLI writes `autoLogoutTimeInSeconds`, so the live test
    // needs a second writer of the account's synced `Settings.json`.
    // `sessions.test.ts` drives the re-read itself; this holds the two
    // published numbers to the constants behind them.
    const guide = fs.readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')
    expect(guide).toContain(`within ${SWEEP_INTERVAL_MS / 1000} seconds`)
    expect(DISABLED_RECHECK_MS).toBe(60_000)
    expect(guide).toContain('within a minute')
    // The slower cadence has to be a multiple of the sweep, or "re-read
    // less often" is a tick that never lines up.
    expect(DISABLED_RECHECK_MS % SWEEP_INTERVAL_MS).toBe(0)
  })

  it('publishes the file suffixes the writer actually uses', () => {
    // `out`'s prose is the fourth statement of the suffix table that
    // `TX_EXPORT_FORMAT_INFO` is now the only source of, and it cannot
    // interpolate for the same reason `limit`'s cannot — `extractRoutes`
    // reads it through the checker as a string literal. A format added to
    // `TX_EXPORT_FORMATS` without a line here is accepted everywhere and
    // then written under a name the reference does not mention.
    const out = asHelpDocs(helpDocs).commands['get-transactions'].params?.out
    expect(out).not.toBeUndefined()
    const prose = out?.doc ?? ''
    for (const suffix of TX_EXPORT_SUFFIXES) {
      expect(prose).toContain(suffix)
    }
    expect(TX_EXPORT_SUFFIXES).toHaveLength(
      Object.keys(TX_EXPORT_FORMAT_INFO).length
    )
  })
})

/**
 * The client must not give up on a shutting-down engine before the engine has
 * finished shutting down.
 *
 * `apiClient` waited 15 s under a comment claiming it was "bounded by the
 * drain the engine itself allows, plus a margin", while the drain alone is
 * 110 s. A stop or Ctrl-C with any request slower than 15 s in flight left
 * the socket bound and answering 503; the next command gave up, spawned a
 * replacement, and that child failed to claim the profile and told the user
 * to run `engine-stop` — which is what they had just done.
 */
describe('shutdown budgets', () => {
  it('covers every bounded phase of the engine teardown', () => {
    // Written out term by term, because the constant was three of them —
    // 150 s against a real 220 s — under a docblock claiming it was all of
    // them. The gap was a wasted spawn until the client learned to report
    // past the ceiling; now it tells the operator to kill a daemon that is
    // draining as designed. A new bounded phase has to move this line.
    expect(SHUTDOWN_WAIT_MS).toBe(
      SHUTDOWN_DRAIN_MS +
        // `objects.clearAll()`, then `releaseHandles` inside the logout —
        // each waiting for a call in flight and then bounding one
        // handle's own `onExpire`.
        2 * (HANDLE_BUSY_WAIT_MS + HANDLE_TEARDOWN_WAIT_MS) +
        LOGOUT_WAIT_MS +
        // `account.logout()` and `core.context.close()`.
        2 * CORE_TEARDOWN_WAIT_MS +
        // Two listeners, each waiting and then closing its connections.
        4 * LISTENER_CLOSE_WAIT_MS
    )
    expect(SHUTDOWN_WAIT_MS).toBeGreaterThan(SHUTDOWN_DRAIN_MS)
  })
})

/**
 * The published `actionType` set must be the one the cleaner dispatches on.
 *
 * `save-tx-action` writes into the wallet's synced transaction file, and its
 * `savedAction` description is the only place a caller learns which action
 * types the engine takes. It listed five of the six — `swapSend`, the arm
 * this branch picked up from develop, was missing — so a caller holding a
 * `swapSend` action read that the engine would reject it. The description
 * cannot interpolate the set, for the same reason the limit above cannot.
 */
describe('save-tx-action actionType set', () => {
  it('publishes every arm the dispatcher has', () => {
    const prose =
      asHelpDocs(helpDocs).commands['save-tx-action'].params?.savedAction
        ?.doc ?? ''
    expect(prose).not.toBe('')
    for (const actionType of TX_ACTION_TYPES) {
      expect(prose).toContain(actionType)
    }
  })
})

/**
 * The rate queue has to give up before the client stops waiting.
 *
 * `RATE_QUERY_TIMEOUT_MS` bounds one upstream request and `doQuery` recurses
 * once per batch of at most 99 keys, so a caller's wait was (batches) × 30 s
 * — 13 passes, about 390 s, for the 1,200 unpriced transactions
 * `fillTxsFiat`'s docblock names. The client reported `Request timed out` at
 * 120 s and the daemon kept working for another four and a half minutes with
 * `inQuery` latched and every other rate caller queued behind it. The chain
 * budget is what stops that, and it only does so while it is under the
 * client's own deadline — which lives in a different module, so the pair is
 * kept in step here rather than in `exchangeRatesCache.test.ts`, whose
 * subject is Node-safe and must not import the CLI client.
 */
describe('rate budgets', () => {
  it('gives up before the client does', () => {
    expect(RATE_CHAIN_TIMEOUT_MS).toBeLessThan(DEFAULT_TIMEOUT_MS)
    expect(RATE_QUERY_TIMEOUT_MS).toBeLessThan(RATE_CHAIN_TIMEOUT_MS)
  })
})
