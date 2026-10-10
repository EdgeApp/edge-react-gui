/**
 * The response shapes the client reads, cleaned rather than cast.
 *
 * `ApiClient.request` ends `return parsed as T`, which is a type assertion
 * over whatever the engine sent. For most commands that is harmless — the
 * value is printed and forgotten — but five of them act on it, and the cast
 * turns a field that did not arrive into `undefined` somewhere downstream
 * instead of a named failure here:
 *
 *   * a login reads `sessionId` and writes it to the `0600` session file;
 *   * the edge-login poll drives a five-minute loop off `state`;
 *   * `change-enabled-token-ids --add/--remove` reads the current set and
 *     posts back the *complete desired* set, so a missing `enabledTokenIds`
 *     made `new Set(undefined)` — an empty set, not a throw — and `--add X`
 *     replaced every enabled asset on the wallet with `X` in the account's
 *     synced wallet file, on every device, while `--remove X` disabled them
 *     all;
 *   * `balance-map --token-id` filters `balances`;
 *   * `get-transactions --export-format` writes each `file.contents` to a
 *     path built from `file.format` on the user's disk.
 *
 * The cleaners come from the engine's own `schemas.ts`, so the client and
 * the engine cannot describe a session differently — the shape was
 * hand-declared three times on this side, beside the engine's `asSession`
 * and `SessionInfo`.
 */
import { asArray, asMaybe, asObject } from 'cleaners'

import { asTxExportFile } from '../util/txExport'
import {
  asBalance,
  asEnabledTokens,
  asPendingEdgeLogin,
  asSession,
  asSubscriptionClosed,
  type PendingEdgeLogin,
  type Session
} from './engine/schemas'

/** The `balance-map` 200, which the engine declares field by field. */
const asBalanceList = asObject({ balances: asArray(asBalance) })

/**
 * The published shapes, from the one place that derives them.
 *
 * Re-exported rather than derived a second time: `schemas.ts` now carries
 * the `ReturnType` for each of these beside the cleaner, so the client and
 * the engine cannot end up with two spellings of a session.
 */
export type { PendingEdgeLogin, Session }

/** What `subscription.closed` carries, and the exit code reads. */
type SubscriptionClosed = ReturnType<typeof asSubscriptionClosed>

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

/**
 * The set `change-enabled-token-ids --add/--remove` posts back.
 *
 * Out of the command handler so it can be tested: the route's body is the
 * *complete desired set*, so this arithmetic is what decides whether a
 * wallet keeps its tokens. The bug `readEnabledTokens` exists for lived
 * here — a cast made a missing `enabledTokenIds` an empty set rather than
 * a throw, and `--add X` then posted `['X']` and wiped the rest from the
 * account's synced wallet file on every device — and the one offline case
 * that reached this code ran on a wallet whose set was already empty, so
 * it passed identically either way.
 */
export function nextEnabledTokenIds(
  current: readonly string[],
  added: readonly string[],
  removed: readonly string[]
): string[] {
  const next = new Set(current)
  for (const id of added) next.add(id)
  for (const id of removed) next.delete(id)
  return [...next]
}

/** A wallet's enabled tokens, which `change-enabled-token-ids` edits. */
export function readEnabledTokens(
  raw: unknown,
  what: string
): ReturnType<typeof asEnabledTokens> {
  return cleanResponse(asMaybe(asEnabledTokens), raw, what)
}

/** A wallet's balances, which `balance-map --token-id` filters. */
export function readBalances(
  raw: unknown,
  what: string
): { balances: Array<ReturnType<typeof asBalance>> } {
  return cleanResponse(asMaybe(asBalanceList), raw, what)
}

/**
 * The files `get-transactions --export-format` writes to disk.
 *
 * Declared here rather than taken from the engine: that route's `returns` is
 * `asCoreValue`, because the same call answers a listing or an export. This
 * is the export arm, and it is the one the client acts on.
 */
const asExportedFiles = asObject({
  files: asArray(asTxExportFile)
})

export function readExportedFiles(
  raw: unknown,
  what: string
): ReturnType<typeof asExportedFiles> {
  return cleanResponse(asMaybe(asExportedFiles), raw, what)
}

/**
 * The `subscription.closed` frame, cleaned rather than cast.
 *
 * It is acted on, which is this module's whole criterion: `reason` decides
 * the process exit code through `exitCodeForClose`. It was read through a
 * hand-written interface and a cast — `(data as ClosedData)?.reason` — on a
 * payload that arrives from `emitFrame`'s bare `JSON.parse` with no cleaner
 * anywhere on the path, so the client and the engine could describe a close
 * reason differently with nothing to notice.
 *
 * `asMaybe` with no throw, unlike the five above: an unrecognised or absent
 * reason already means "the engine ended this for a reason this client does
 * not know", which `exitCodeForClose` answers with `EXIT.ENGINE`. Failing
 * the command instead would turn a frame it cannot read into a worse
 * outcome than the one it is reporting.
 */
export function readSubscriptionClosed(
  raw: unknown
): SubscriptionClosed | undefined {
  return asMaybe(asSubscriptionClosed)(raw)
}
