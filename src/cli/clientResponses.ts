/**
 * The response shapes the client reads, cleaned rather than cast.
 *
 * `ApiClient.request` ends `return parsed as T`, which is a type assertion
 * over whatever the engine sent. For most commands that is harmless — the
 * value is printed and forgotten — but two of them act on it: a login reads
 * `sessionId` and writes it to the `0600` session file, and the edge-login
 * poll drives a five-minute loop off `state`. A cast there means an
 * unexpected response becomes `undefined` deep inside the client instead of
 * a named failure here.
 *
 * The cleaners come from the engine's own `schemas.ts`, so the client and
 * the engine cannot describe a session differently — the shape was
 * hand-declared three times on this side, beside the engine's `asSession`
 * and `SessionInfo`.
 */
import { asMaybe } from 'cleaners'

import { asPendingEdgeLogin, asSession } from './engine/schemas'

export type Session = ReturnType<typeof asSession>
export type PendingEdgeLogin = ReturnType<typeof asPendingEdgeLogin>

/**
 * Clean one response, naming the route when it does not fit.
 *
 * `asMaybe` plus an explicit throw, rather than letting the cleaner's own
 * `TypeError` out: the message a caller sees should say which call answered
 * unexpectedly, not which property was missing from an anonymous object.
 */
function cleanResponse<T>(
  cleaner: (raw: unknown) => T | undefined,
  raw: unknown,
  what: string
): T {
  const clean = cleaner(raw)
  if (clean == null) {
    throw new Error(
      `The engine's ${what} response was not in the expected shape. This ` +
        'usually means the client and the engine are different versions; ' +
        'check `edge-cli engine-status` for the engine’s apiVersion.'
    )
  }
  return clean
}

/** A login or keepalive response, with a usable `sessionId`. */
export function readSession(raw: unknown, what: string): Session {
  return cleanResponse(asMaybe(asSession), raw, what)
}

/** A pending edge login, as `request-edge-login` and the poll return it. */
export function readPendingEdgeLogin(
  raw: unknown,
  what: string
): PendingEdgeLogin {
  return cleanResponse(asMaybe(asPendingEdgeLogin), raw, what)
}
