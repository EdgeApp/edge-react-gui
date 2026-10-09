import { hasOwn } from '../../util/predicates'
import type { ErrorResponse } from '../engine/errors'

/**
 * The exit code each error code maps to.
 *
 * One table, read by `output.ts` to choose the code and by
 * `docs/api/shared.ts` to publish it. Both used to state the same membership
 * separately — a 35-line `if`-chain here and English prose inside a `doc`
 * field there — with nothing tying them together, so a code added to one
 * would silently not appear in the other.
 *
 * No imports, so the docs build does not pull in the client.
 */
export const EXIT = {
  OK: 0,
  GENERIC: 1,
  USAGE: 2,
  AUTH: 3,
  NOT_FOUND: 4,
  VALIDATION: 5,
  NETWORK: 6,
  ENGINE: 7
} as const

/**
 * The codes assigned from an explicit list.
 *
 * Nothing is tried in order: `exitCodeForApiError` is one lookup in this
 * map. The key order decides the order `errorCodesFor` renders the published
 * table in, which is the only thing it means.
 */
export const EXIT_CODE_BY_ERROR: Record<string, number> = {
  INVALID_SESSION: EXIT.AUTH,
  SESSION_EXPIRED: EXIT.AUTH,
  // The TCP transport's own guards. An exit code of its own would be a new
  // public contract; "the call was refused for an auth reason" is what a
  // script needs, and that is what AUTH means.
  UNAUTHORIZED: EXIT.AUTH,
  FORBIDDEN: EXIT.AUTH,
  PASSWORD_ERROR: EXIT.AUTH,
  OTP_REQUIRED: EXIT.AUTH,
  CHALLENGE_REQUIRED: EXIT.AUTH,
  PIN_DISABLED: EXIT.AUTH,

  // Every published code whose status is 404, which `exitCodes.test.ts`
  // checks against the catalogue. Three of the seven were here and four
  // were not, so a stale object handle — the most likely failure in the
  // staged spend and swap flows, since a handle lives five minutes — exited
  // `1`, "failed, with no more specific mapping", across the ten commands
  // that publish `OBJECT_NOT_FOUND`. A script driving `make-spend` →
  // `sign-tx` → `broadcast-tx` could not tell "the quote expired, start
  // again" from a generic failure, which is the distinction this table is
  // for.
  NOT_FOUND: EXIT.NOT_FOUND,
  NO_LOGIN_REQUEST: EXIT.NOT_FOUND,
  OBJECT_NOT_FOUND: EXIT.NOT_FOUND,
  PENDING_LOGIN_NOT_FOUND: EXIT.NOT_FOUND,
  TOKEN_NOT_FOUND: EXIT.NOT_FOUND,
  USER_NOT_FOUND: EXIT.NOT_FOUND,
  WALLET_NOT_FOUND: EXIT.NOT_FOUND,

  BAD_REQUEST: EXIT.VALIDATION,
  INSUFFICIENT_FUNDS: EXIT.VALIDATION,
  DUST_SPEND: EXIT.VALIDATION,
  PENDING_FUNDS: EXIT.VALIDATION,
  SPEND_TO_SELF: EXIT.VALIDATION,
  NO_AMOUNT_SPECIFIED: EXIT.VALIDATION,
  AMBIGUOUS_WALLET_ID: EXIT.VALIDATION,
  USERNAME_ERROR: EXIT.VALIDATION,

  NETWORK_ERROR: EXIT.NETWORK,
  // The client's own two: a deadline it set, and a connection that went
  // away. Both are "no answer arrived", which is what NETWORK means here,
  // and both used to fall through the generic arm as `INTERNAL_ERROR` and
  // exit 1 — on the one failure `--timeout` is documented as the routine
  // way to avoid.
  REQUEST_TIMEOUT: EXIT.NETWORK,
  CONNECTION_CLOSED: EXIT.NETWORK,

  // Before the status fallback: both are 503s the fallback would call
  // network failures, and one is a daemon going away while the other is the
  // client never reaching one.
  ENGINE_SHUTTING_DOWN: EXIT.ENGINE,
  ENGINE_UNAVAILABLE: EXIT.ENGINE,

  // A 400 that is argv rather than a field, so the validation fallback would
  // be wrong: the client writes it before any request is made.
  USAGE: EXIT.USAGE,

  // The two that are *meant* to be generic, listed so the gate can tell
  // "deliberately unclassified" from "forgotten". `INTERNAL_ERROR` is the
  // unmapped engine or plugin failure by definition, and `OBSOLETE_API`
  // means this build is too old for the login server — there is no exit code
  // for "upgrade me" and inventing one would be a new public contract.
  INTERNAL_ERROR: EXIT.GENERIC,
  OBSOLETE_API: EXIT.GENERIC
}

/**
 * The fallback for a published code with no row of its own.
 *
 * Nine codes fell through to `1` — "failed, with no more specific mapping" —
 * while their status-mates were mapped: `OBJECT_KIND_MISMATCH` and
 * `MISSING_BITWAVE_ACCOUNT_ID` beside `BAD_REQUEST`, the four `SWAP_*` limit
 * codes beside `INSUFFICIENT_FUNDS`, `SWAP_PERMISSION` beside `FORBIDDEN`,
 * `OBJECT_IN_USE` beside `AMBIGUOUS_WALLET_ID`. So a script branching on the
 * published table read its own correctable mistake — "the swap amount is
 * below the exchange's minimum", "you passed the wrong kind of handle" — as
 * an unclassified failure.
 *
 * The 404 half was already derived from the catalogue, which is why its
 * seven are complete; this is the same idea for every other status, and
 * `exitCodes.test.ts` now requires that *every* published code resolves to
 * something other than `GENERIC` unless it is one of the two listed above as
 * meant to be.
 *
 * A code whose status says the wrong thing gets a row above instead: that is
 * what `PASSWORD_ERROR` (a 401 that is auth) and `USERNAME_ERROR` (a 400
 * that is validation) already are.
 */
export const EXIT_BY_STATUS: Record<number, number> = {
  400: EXIT.VALIDATION,
  401: EXIT.AUTH,
  403: EXIT.AUTH,
  404: EXIT.NOT_FOUND,
  // The caller used a method the route does not take, which is a malformed
  // request like any other.
  405: EXIT.VALIDATION,
  409: EXIT.VALIDATION,
  // `OBJECT_EXPIRED`: the handle is gone, which is the "start again" signal
  // and the same answer as a handle that was never there.
  410: EXIT.NOT_FOUND,
  413: EXIT.VALIDATION,
  415: EXIT.VALIDATION,
  422: EXIT.VALIDATION,
  500: EXIT.GENERIC,
  // The documented rule, now part of the table rather than a line of code
  // after it.
  503: EXIT.NETWORK,
  504: EXIT.NETWORK
}

/** Every error code that maps to one exit code, for the published table. */
export function errorCodesFor(exitCode: number): string[] {
  return Object.keys(EXIT_CODE_BY_ERROR).filter(
    code => EXIT_CODE_BY_ERROR[code] === exitCode
  )
}

/** The exit code for one API error. */
export function exitCodeForApiError(code: string, status: number): number {
  // `hasOwn`, because `code` arrives in a response body and this is a plain
  // object literal: `"code": "constructor"` resolved to an inherited
  // `Object.prototype` member, which is not a number but is not null either.
  const mapped = hasOwn(EXIT_CODE_BY_ERROR, code)
    ? EXIT_CODE_BY_ERROR[code]
    : undefined
  if (mapped != null) return mapped
  const byStatus = hasOwn(EXIT_BY_STATUS, status)
    ? EXIT_BY_STATUS[status]
    : undefined
  if (byStatus != null) return byStatus
  return EXIT.GENERIC
}

/**
 * Write one error envelope to stderr.
 *
 * Here, in the leaf module, because three places write a `USAGE` envelope
 * and one of them cannot import `output.ts`: `bootNodeLocale.ts` runs before
 * the client exists and importing it would cycle through `spawnEngine`. Two
 * of the three therefore spelled `{ error: { code, message, status } }` as
 * an untyped literal with a hardcoded `400`, which is two more descriptions
 * of the CLI's documented failure format than there should be — a renamed
 * field would compile in both and ship two shapes.
 *
 * `ErrorResponse` is the engine's declaration, so the client and the engine
 * cannot describe a failure differently. This module imports nothing but
 * `util/predicates`, and `errors.ts` is types-and-cleaner only, so it stays
 * loadable anywhere.
 */
export function printErrorEnvelope(error: {
  code: string
  message: string
  status: number
  details?: Record<string, unknown>
}): void {
  const body: ErrorResponse['body'] = { error }
  console.error(JSON.stringify(body, null, 2))
}

/** The `USAGE` envelope, which three entry points write for bad argv. */
export function printUsageEnvelope(message: string): void {
  printErrorEnvelope({ code: 'USAGE', message, status: 400 })
}
