import { describe, expect, it } from '@jest/globals'

import { cleanSseQuery } from '../../cli/engine/server'

const query = (search: string): URL =>
  new URL(`http://localhost/engine/events${search}`)

/**
 * The stream route's scope comes from its own declaration.
 *
 * `/engine/events` is served outside the router, so its `query` cleaner is
 * applied by hand. The first version of that applied the cleaner to an object
 * it assembled from a hard-coded field list and threw the cleaned value away,
 * while the handler went on reading `searchParams` itself — two declarations
 * of one route's query, of which only the hand-written one decided anything.
 */
describe('cleanSseQuery', () => {
  it('returns the scope the caller asked for', () => {
    expect(cleanSseQuery(query('?sessionId=abc&walletId=xyz'))).toMatchObject({
      sessionId: 'abc',
      walletId: 'xyz'
    })
  })

  it('treats `?walletId=` as absent, by the rule every route uses', () => {
    const scope = cleanSseQuery(query('?sessionId=abc&walletId='))
    expect(scope.sessionId).toBe('abc')
    expect(scope.walletId).toBeUndefined()
  })

  it('has no scope at all when nothing is asked for', () => {
    const scope = cleanSseQuery(query(''))
    expect(scope.sessionId).toBeUndefined()
    expect(scope.walletId).toBeUndefined()
  })

  it('is the cleaner’s own output, rest fields and all', () => {
    // `.withRest` on the declaration keeps `type`, which `cli.extra`
    // declares and the transport filter reads. A hand-built pair of fields
    // cannot carry it, so this fails if the scope stops coming from the
    // cleaner.
    const scope = cleanSseQuery(query('?type=core.log'))
    expect(scope).toMatchObject({ type: 'core.log' })
  })
})
