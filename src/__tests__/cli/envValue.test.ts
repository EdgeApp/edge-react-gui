import { describe, expect, it } from '@jest/globals'

import { emptyToUndefined } from '../../cli/envValue'

/**
 * A variable that is set but blank is as good as unset.
 *
 * `''` is not nullish, so a blank `EDGE_CLI_SESSION` shadowed the session
 * file it was meant to override: `needsSession` tests `== null` and passed,
 * every account command then built `/account//…`, which the router cannot
 * match, and they all answered NOT_FOUND while a perfectly good
 * `session.json` sat unread. `EDGE_CLI_API_KEY` had the same shape on the
 * engine side, which is why there is one helper.
 */
describe('emptyToUndefined', () => {
  it('treats an empty value as unset', () => {
    expect(emptyToUndefined('')).toBeUndefined()
    expect(emptyToUndefined(undefined)).toBeUndefined()
  })

  it('passes anything else through, whitespace included', () => {
    // Not trimmed: a session id is opaque, and quietly reshaping a value is
    // how a caller ends up debugging the wrong thing.
    expect(emptyToUndefined('sess_abc')).toBe('sess_abc')
    expect(emptyToUndefined(' ')).toBe(' ')
  })
})
