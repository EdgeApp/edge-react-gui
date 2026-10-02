import { describe, expect, it } from '@jest/globals'

import { DEFAULT_TX_LIMIT } from '../../cli/engine/routes/transactions'
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
