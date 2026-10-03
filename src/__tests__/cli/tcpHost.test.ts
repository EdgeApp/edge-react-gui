import { describe, expect, it } from '@jest/globals'

import { parseTcpHost } from '../../cli/engine/tcpPort'
import { allowedHostnamesFor, hostnameOf } from '../../cli/engine/transportAuth'

/**
 * One spelling, everywhere.
 *
 * `--tcp-host=[::1]` was accepted and then answered nothing.
 * `allowedHostnamesFor` seeded its set from the raw string, so the set held
 * `[::1]`, while the `Host` header comparison strips the brackets `URL`
 * keeps — so a caller's `Host: [::1]:9008` arrived as `::1`, missed the set,
 * and every request was refused 403 with a message about DNS rebinding. The
 * unbracketed form worked, which is what made the bracketed one a trap.
 */
describe('parseTcpHost', () => {
  it('canonicalises a bracketed IPv6 literal', () => {
    expect(parseTcpHost('[::1]')).toBe('::1')
    expect(parseTcpHost('::1')).toBe('::1')
  })

  it('accepts the other loopback spellings unchanged', () => {
    expect(parseTcpHost('localhost')).toBe('localhost')
    expect(parseTcpHost('127.0.0.1')).toBe('127.0.0.1')
    expect(parseTcpHost('127.0.0.53')).toBe('127.0.0.53')
  })

  it('refuses anything not loopback', () => {
    // An engine reachable from the LAN exposes `get-raw-private-key` and
    // `spend` to it, which no token makes safe to offer by accident.
    for (const host of ['0.0.0.0', '10.0.0.1', '192.168.1.5', 'example.com']) {
      expect(() => parseTcpHost(host)).toThrow(/loopback/)
    }
  })

  it('agrees with what the Host header will look like', () => {
    // The pair that disagreed. Whatever `parseTcpHost` returns has to be in
    // the allowed set under the name a caller's `Host` header reduces to —
    // and an IPv6 `Host` is always bracketed, whichever spelling was typed
    // on the command line.
    for (const typed of ['[::1]', '::1', 'localhost', '127.0.0.1']) {
      const bound = parseTcpHost(typed)
      const header = bound.includes(':') ? `[${bound}]:9008` : `${bound}:9008`
      const allowed = allowedHostnamesFor(bound)
      expect(hostnameOf(header)).not.toBeNull()
      expect(allowed.has(hostnameOf(header) ?? '')).toBe(true)
    }
  })
})
