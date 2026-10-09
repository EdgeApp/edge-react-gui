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

  it('refuses a Host header that is not just a host', () => {
    // The guard's whole job, and the direction nothing asserted: the suite
    // ended on `not.toBeNull()` for four good spellings, which a function
    // that never returns null also satisfies. Each of these is a DNS
    // rebinding header that a colon-split parser would have matched on its
    // prefix, against the one listener the CLI exposes over TCP.
    for (const header of [
      '127.0.0.1/evil',
      'evil@127.0.0.1:9008',
      '127.0.0.1:9008 ',
      '127.0.0.1:9008/../evil',
      'user:pass@127.0.0.1:9008',
      '',
      'http://127.0.0.1'
    ]) {
      expect(hostnameOf(header)).toBeNull()
    }
  })

  it('does not let a refusal fall through to a set hit', () => {
    // `hostnameOf` answers null and the caller compares `?? ''`, so an
    // allowed set containing the empty string would accept every refusal.
    for (const bound of ['127.0.0.1', '::1', 'localhost']) {
      expect(allowedHostnamesFor(bound).has('')).toBe(false)
    }
  })
})

describe('parseTcpHost refuses spellings that are not addresses', () => {
  it('refuses an IPv4-looking string net.isIP rejects', () => {
    // The pattern alone accepted these, and `server.listen` then sent them
    // through DNS resolution: a startup failure with a DNS error for an argv
    // mistake, or a listener whose `Host` set matched nothing.
    for (const host of ['127.000.000.001', '127.999.999.999', '127.1.1']) {
      expect(() => parseTcpHost(host)).toThrow(RangeError)
    }
  })

  it('still takes every real loopback spelling', () => {
    expect(parseTcpHost('127.0.0.1')).toBe('127.0.0.1')
    expect(parseTcpHost('127.1.2.3')).toBe('127.1.2.3')
    expect(parseTcpHost('[::1]')).toBe('::1')
    expect(parseTcpHost('localhost')).toBe('localhost')
  })
})
