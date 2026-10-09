/**
 * Authentication for the optional loopback TCP listener.
 *
 * The unix socket needs none: it is `0600` inside a `0700` directory, so the
 * operating system is the check — only this user's processes can connect. A
 * TCP port has no such thing. Every process on the host can reach
 * `127.0.0.1` whatever user it runs as, and a web page the user happens to
 * visit can reach it as well. That matters here more than it would for most
 * daemons, because a `sessionId` is full account authority —
 * `get-raw-private-key`, `get-pin`, `get-login-key` and `spend` all take
 * nothing else — and the reachable routes do more than read: an unauthorised
 * local process that guessed or read one id could spend from the account.
 *
 * `GET /engine/sessions` is deliberately not that leak: it truncates every id
 * it lists (`SessionStore.list`), because a route that needs no session must
 * not hand out a credential. The ids live in the `0600` `session.json` and in
 * the login responses, which is why the guards below are about who may
 * connect at all rather than about that one listing.
 *
 * Three guards, because the caller to exclude may be local or remote:
 *
 *  - A bearer token, minted per engine and written only to the `0600` run
 *    file, so a caller has to be able to read that file.
 *  - It is required in `X-Edge-Token`, which is not a CORS-safelisted request
 *    header. A browser therefore has to preflight, and this engine answers no
 *    preflight, which is what stops a cross-site request — including the
 *    no-body `POST /engine/stop` that is otherwise a CORS "simple request".
 *  - `Host` has to be the address the listener is bound to, and `Origin` has
 *    to be absent. That is what stops DNS rebinding, where a page the user is
 *    looking at resolves an attacker's name to `127.0.0.1` and talks to the
 *    engine as same-origin.
 */
import crypto from 'crypto'
import type { IncomingMessage } from 'http'
import { base64url } from 'rfc4648'

import { engineError } from './errors'

/** The header a TCP caller presents its token in. */
export const TCP_TOKEN_HEADER = 'x-edge-token'

/** What the TCP listener will accept. */
export interface TcpGuard {
  token: string
  /**
   * Lower-cased host *names* this listener answers to.
   *
   * Names, not `host:port`: the port a caller names is not what rebinding
   * abuses, and comparing names only keeps this independent of the port the
   * listener actually bound, which `--tcp=0` leaves to the OS.
   */
  allowedHostnames: Set<string>
}

/**
 * A fresh token for one engine's lifetime.
 *
 * 32 bytes from the system CSPRNG, base64url so it survives a header, a
 * shell and a JSON file unescaped. It is never derived from the profile or
 * the pid: both are guessable, and the whole point is that reading the run
 * file is the only way to get it.
 */
export function makeTcpToken(): string {
  return base64url.stringify(crypto.randomBytes(32), { pad: false })
}

/** Every host name a listener on this address legitimately answers to. */
export function allowedHostnamesFor(host: string): Set<string> {
  const names = new Set<string>([host.toLowerCase()])
  // A loopback listener is reached under any of these spellings, and `Host`
  // carries whichever one the caller typed.
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') {
    names.add('127.0.0.1')
    names.add('localhost')
    names.add('::1')
  }
  return names
}

/**
 * The host name a `Host` header names, or null when it is unparseable.
 *
 * Parsed with `URL` rather than split on a colon, so `[::1]:9008` yields
 * `::1` and a header with a path, userinfo or whitespace in it is refused
 * rather than partially matched.
 */
export function hostnameOf(hostHeader: string): string | null {
  // Before `URL`, which strips surrounding whitespace rather than refusing
  // it — so `127.0.0.1:9008 ` parsed as the loopback host and the docblock
  // above was false about the one spelling it names.
  if (/\s/.test(hostHeader)) return null
  try {
    const url = new URL(`http://${hostHeader}`)
    if (url.hostname === '' || url.pathname !== '/' || url.username !== '') {
      return null
    }
    // `URL` keeps the brackets on an IPv6 literal.
    return url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  } catch {
    return null
  }
}

/** Constant-time compare, so a wrong token leaks no prefix length. */
function sameToken(presented: string, expected: string): boolean {
  const encoder = new TextEncoder()
  const presentedBytes = encoder.encode(presented)
  const expectedBytes = encoder.encode(expected)
  if (presentedBytes.length !== expectedBytes.length) return false
  return crypto.timingSafeEqual(presentedBytes, expectedBytes)
}

/**
 * Refuse a TCP request that is not from a local caller holding the token.
 *
 * Throws an `EngineError`, so the request handler's own error path answers it
 * as the published envelope.
 */
export function checkTcpRequest(req: IncomingMessage, guard: TcpGuard): void {
  // A browser always sends `Origin` on a cross-site request and cannot forge
  // its absence, so this is the cheapest of the three to check.
  if (req.headers.origin != null) {
    throw engineError(
      'FORBIDDEN',
      'Cross-origin requests are not accepted on the TCP transport',
      403
    )
  }

  const header = String(req.headers.host ?? '')
  const hostname = hostnameOf(header)
  if (hostname == null || !guard.allowedHostnames.has(hostname)) {
    throw engineError(
      'FORBIDDEN',
      `Unexpected Host header "${header}". The TCP transport answers only to the address it is bound to, so a name that merely resolves to this port is refused.`,
      403
    )
  }

  const presented = req.headers[TCP_TOKEN_HEADER]
  const token = Array.isArray(presented) ? presented[0] : presented
  if (token == null || !sameToken(token, guard.token)) {
    throw engineError(
      'UNAUTHORIZED',
      'A valid X-Edge-Token header is required on the TCP transport. The token is the `tcpToken` field of the engine run file.',
      401
    )
  }
}
