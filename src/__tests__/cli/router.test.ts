import { describe, expect, it } from '@jest/globals'

import { Router } from '../../cli/engine/router'
import { thrownSync } from '../../util/fake/thrownEngineError'

/** The `code` an engineError carries, which is the contract callers read. */
function codeOf(fn: () => unknown): string {
  return thrownSync(fn).code
}

const noop = (): undefined => undefined

describe('Router.match', () => {
  it('extracts named parameters', () => {
    const router = new Router()
    router.add('GET', '/account/{sessionId}/wallet/balance-map', noop)
    const hit = router.match('GET', '/account/sess_abc/wallet/balance-map')
    expect(hit?.params).toStrictEqual({ sessionId: 'sess_abc' })
  })

  it('does not let a parameter swallow a path separator', () => {
    const router = new Router()
    router.add('GET', '/object/{objectId}', noop)
    // `([^/]+)`, not `(.+)`: a greedy pattern would match this and hand the
    // handler an objectId containing a path.
    expect(router.match('GET', '/object/tx_1/extra')).toBeNull()
  })

  it('is case-insensitive about the method and nothing else', () => {
    const router = new Router()
    router.add('post', '/engine/stop', noop)
    expect(router.match('POST', '/engine/stop')).not.toBeNull()
    expect(router.match('GET', '/engine/stop')).toBeNull()
    expect(router.match('POST', '/Engine/Stop')).toBeNull()
  })

  it('escapes regex metacharacters in literal segments', () => {
    const router = new Router()
    router.add('GET', '/rates/usd-to-native', noop)
    // Unescaped, the `-` is harmless but a `.` is not: `/rates/usd.to.native`
    // would match a pattern written with dots.
    expect(router.match('GET', '/rates/usd-to-native')).not.toBeNull()
    expect(router.match('GET', '/ratesXusd-to-native')).toBeNull()
  })

  it('answers a malformed percent-escape with BAD_REQUEST', () => {
    const router = new Router()
    router.add('GET', '/object/{objectId}', noop)
    // `new URL()` accepts this and `decodeURIComponent` then throws
    // `URIError`, which reached the catch-all as a 500 — a caller's bad URL
    // reported as an engine fault on a route declaring 400 and 404.
    expect(codeOf(() => router.match('GET', '/object/%ZZ'))).toBe('BAD_REQUEST')
  })

  it('decodes a legitimately encoded parameter', () => {
    const router = new Router()
    router.add('GET', '/local-user/{username}', noop)
    const hit = router.match('GET', '/local-user/a%20b')
    expect(hit?.params).toStrictEqual({ username: 'a b' })
  })

  it('returns null for a path no route covers', () => {
    const router = new Router()
    router.add('GET', '/engine/status', noop)
    expect(router.match('GET', '/engine/nope')).toBeNull()
  })
})
