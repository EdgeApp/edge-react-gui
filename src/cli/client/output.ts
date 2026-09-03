import { ApiClientError } from './apiClient'

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

export function printJson(value: unknown): void {
  if (typeof value === 'string') {
    console.log(value)
  } else {
    console.log(JSON.stringify(value, null, 2))
  }
}

/**
 * Always emit a single JSON object on stderr for machine-readable errors.
 * No prose banners (e.g. CAPTCHA hints).
 */
export function printError(error: unknown): number {
  if (error instanceof ApiClientError) {
    const body = {
      error: {
        code: error.code,
        message: error.message,
        status: error.status,
        ...(error.details != null ? { details: error.details } : {})
      }
    }
    console.error(JSON.stringify(body, null, 2))
    return exitCodeForApiError(error.code, error.status)
  }
  if (error instanceof Error) {
    const body = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        status: 500
      }
    }
    console.error(JSON.stringify(body, null, 2))
    if (
      /Engine is not running|Timed out waiting for engine/.test(error.message)
    ) {
      return EXIT.ENGINE
    }
    return EXIT.GENERIC
  }
  console.error(
    JSON.stringify(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: String(error),
          status: 500
        }
      },
      null,
      2
    )
  )
  return EXIT.GENERIC
}

function exitCodeForApiError(code: string, status: number): number {
  if (
    code === 'INVALID_SESSION' ||
    code === 'SESSION_EXPIRED' ||
    code === 'PASSWORD_ERROR' ||
    code === 'OTP_REQUIRED' ||
    code === 'CHALLENGE_REQUIRED' ||
    code === 'PIN_DISABLED'
  ) {
    return EXIT.AUTH
  }
  if (
    code === 'NOT_FOUND' ||
    code === 'WALLET_NOT_FOUND' ||
    code === 'TOKEN_NOT_FOUND'
  ) {
    return EXIT.NOT_FOUND
  }
  if (
    code === 'BAD_REQUEST' ||
    code === 'INSUFFICIENT_FUNDS' ||
    code === 'DUST_SPEND' ||
    code === 'PENDING_FUNDS' ||
    code === 'SPEND_TO_SELF' ||
    code === 'NO_AMOUNT_SPECIFIED' ||
    code === 'AMBIGUOUS_WALLET_ID' ||
    code === 'USERNAME_ERROR'
  ) {
    return EXIT.VALIDATION
  }
  // Before the 503 test below: the engine only ever sends this code with a
  // 503, so testing status first made EXIT.ENGINE unreachable and reported a
  // daemon that is going away as a network failure.
  if (code === 'ENGINE_SHUTTING_DOWN') return EXIT.ENGINE
  if (code === 'NETWORK_ERROR' || status === 503) return EXIT.NETWORK
  return EXIT.GENERIC
}
