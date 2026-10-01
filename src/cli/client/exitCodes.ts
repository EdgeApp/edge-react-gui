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

/** The codes assigned from an explicit list, in the order they are tried. */
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

  NOT_FOUND: EXIT.NOT_FOUND,
  WALLET_NOT_FOUND: EXIT.NOT_FOUND,
  TOKEN_NOT_FOUND: EXIT.NOT_FOUND,

  BAD_REQUEST: EXIT.VALIDATION,
  INSUFFICIENT_FUNDS: EXIT.VALIDATION,
  DUST_SPEND: EXIT.VALIDATION,
  PENDING_FUNDS: EXIT.VALIDATION,
  SPEND_TO_SELF: EXIT.VALIDATION,
  NO_AMOUNT_SPECIFIED: EXIT.VALIDATION,
  AMBIGUOUS_WALLET_ID: EXIT.VALIDATION,
  USERNAME_ERROR: EXIT.VALIDATION,

  NETWORK_ERROR: EXIT.NETWORK,

  // Before the 503 rule: the engine only ever sends this code with a 503, so
  // testing the status first made EXIT.ENGINE unreachable and reported a
  // daemon that is going away as a network failure.
  ENGINE_SHUTTING_DOWN: EXIT.ENGINE
}

/** Every error code that maps to one exit code, for the published table. */
export function errorCodesFor(exitCode: number): string[] {
  return Object.keys(EXIT_CODE_BY_ERROR).filter(
    code => EXIT_CODE_BY_ERROR[code] === exitCode
  )
}

/** The exit code for one API error. */
export function exitCodeForApiError(code: string, status: number): number {
  const mapped = EXIT_CODE_BY_ERROR[code]
  if (mapped != null) return mapped
  if (status === 503) return EXIT.NETWORK
  return EXIT.GENERIC
}
