import { describe, expect, it } from '@jest/globals'

import { DEFAULT_TX_LIMIT } from '../../cli/engine/routes/transactions'
import {
  HANDLE_BUSY_WAIT_MS,
  LOGOUT_WAIT_MS,
  SHUTDOWN_DRAIN_MS,
  SHUTDOWN_WAIT_MS
} from '../../cli/engine/shutdownTiming'
import helpDocs from '../../cli/generated/helpDocs.json'
import { asHelpDocs } from '../../cli/generatedSchemas'

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
  it('gives the client at least the engine own teardown', () => {
    expect(SHUTDOWN_WAIT_MS).toBeGreaterThan(SHUTDOWN_DRAIN_MS)
    expect(SHUTDOWN_WAIT_MS).toBe(
      SHUTDOWN_DRAIN_MS + HANDLE_BUSY_WAIT_MS + LOGOUT_WAIT_MS
    )
  })
})
