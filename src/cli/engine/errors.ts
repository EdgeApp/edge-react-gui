/**
 * The engine's error contract, in one place.
 *
 * Three jobs. `EngineError` and `engineError()` are what a route throws when
 * the fault is the caller's. `mapCoreError` turns an `edge-core-js` error
 * type into the published code, status and `details` for it — a table, so an
 * arm cannot be the only place a code appears. And `toErrorBody` is the sink
 * every failure passes through on its way to the wire.
 *
 * Every code here must be in the catalogue in `docs/api/shared.ts`, which
 * `npm run docs:api:verify` enforces: a code the engine can emit and the
 * reference cannot describe is a contract a caller cannot program against.
 */
import {
  asMaybeChallengeError,
  asMaybeDustSpendError,
  asMaybeInsufficientFundsError,
  asMaybeNetworkError,
  asMaybeNoAmountSpecifiedError,
  asMaybeObsoleteApiError,
  asMaybeOtpError,
  asMaybePasswordError,
  asMaybePendingFundsError,
  asMaybePinDisabledError,
  asMaybeSameCurrencyError,
  asMaybeSpendToSelfError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapAddressError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  asMaybeUsernameError
} from 'edge-core-js'

export class EngineError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'EngineError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function engineError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): EngineError {
  return new EngineError(code, message, status, details)
}

/**
 * The response every failure becomes.
 *
 * Named once. The `{ status, body: { error: { code, message, status,
 * details? } } }` shape was spelled out verbatim three times in this file and
 * again in the client's `output.ts`.
 */
export interface ErrorResponse {
  status: number
  body: {
    error: {
      code: string
      message: string
      status: number
      details?: Record<string, unknown>
    }
  }
}

/**
 * A message the caller can act on.
 *
 * Every arm below copies core's own `message`, which is the right default —
 * it is written for a person. But most of core's error constructors take the
 * message as an argument, so an empty one reaches here, and a body of
 * `{"code":"PIN_DISABLED","message":""}` tells a caller nothing the code did
 * not already say.
 */
function messageOr(message: string, fallback: string): string {
  return message.trim() === '' ? fallback : message
}

export function toErrorBody(error: unknown): ErrorResponse {
  if (error instanceof EngineError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
          details: error.details
        }
      }
    }
  }

  const mapped = mapCoreError(error)
  if (mapped != null) return mapped

  const message = error instanceof Error ? error.message : String(error)
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message,
        status: 500
      }
    }
  }
}

/**
 * One core error type, and the response it becomes.
 *
 * A table rather than eighteen near-identical blocks. Each block wrote its
 * status *twice* — once for the HTTP response and once inside the body — so
 * half the file was a place for the two to disagree, and adding an arm meant
 * copying thirty lines and changing four things in it.
 */
interface CoreErrorArm<T> {
  /** The `asMaybe*` cleaner that recognises it. */
  match: (error: unknown) => T | undefined
  code: string
  status: number
  /** Used when core's own message is empty. */
  fallback: string
  /** The fields this code promises in `details`. */
  details?: (error: T) => Record<string, unknown>
  /** Only for a code whose message is assembled rather than copied. */
  message?: (error: T) => string
}

/**
 * Checked in order, so a more specific arm can precede a general one.
 *
 * `any` on the arm type: each `asMaybe*` returns its own core error shape and
 * the table is heterogeneous by construction, which a single generic cannot
 * express without a union of all eighteen.
 */
const CORE_ERROR_ARMS: Array<CoreErrorArm<any>> = [
  {
    match: asMaybeChallengeError,
    code: 'CHALLENGE_REQUIRED',
    status: 403,
    fallback: 'Login requires a CAPTCHA challenge',
    // Assembled, not copied: the id and the URI are what a caller needs to
    // act on, and they are easy to miss in `details` alone.
    message: error =>
      [
        messageOr(error.message, 'Login requires a CAPTCHA challenge'),
        error.challengeId != null ? `challengeId=${error.challengeId}` : null,
        error.challengeUri != null
          ? `challengeUri=${error.challengeUri}`
          : null,
        'Retry the same request with body/query challengeId after solving, or use CLI --solve-captcha.'
      ]
        .filter((part): part is string => part != null && part !== '')
        .join(' '),
    details: error => ({
      challengeId: error.challengeId,
      challengeUri: error.challengeUri
    })
  },
  {
    match: asMaybePasswordError,
    code: 'PASSWORD_ERROR',
    status: 401,
    fallback: 'Invalid password',
    details: error => ({ wait: error.wait })
  },
  {
    match: asMaybeOtpError,
    code: 'OTP_REQUIRED',
    status: 401,
    fallback: 'Invalid OTP token',
    details: error => ({
      reason: error.reason,
      loginId: error.loginId,
      resetDate: error.resetDate?.toISOString(),
      resetToken: error.resetToken,
      voucherId: error.voucherId,
      voucherAuth: error.voucherAuth,
      voucherActivates: error.voucherActivates?.toISOString()
    })
  },
  {
    match: asMaybeUsernameError,
    code: 'USERNAME_ERROR',
    status: 400,
    fallback: 'Invalid username'
  },
  {
    match: asMaybePinDisabledError,
    code: 'PIN_DISABLED',
    status: 403,
    fallback: 'PIN login is disabled for this account'
  },
  {
    match: asMaybeInsufficientFundsError,
    code: 'INSUFFICIENT_FUNDS',
    status: 422,
    fallback: 'Insufficient funds',
    details: error => ({
      tokenId: error.tokenId,
      networkFee: error.networkFee
    })
  },
  {
    match: asMaybeDustSpendError,
    code: 'DUST_SPEND',
    status: 422,
    fallback: 'Amount is below the dust threshold'
  },
  {
    match: asMaybePendingFundsError,
    code: 'PENDING_FUNDS',
    status: 422,
    fallback: 'Funds are still pending'
  },
  {
    match: asMaybeSpendToSelfError,
    code: 'SPEND_TO_SELF',
    status: 422,
    fallback: 'Cannot send to the sending wallet'
  },
  {
    match: asMaybeNoAmountSpecifiedError,
    code: 'NO_AMOUNT_SPECIFIED',
    status: 400,
    fallback: 'No amount specified'
  },
  {
    match: asMaybeNetworkError,
    code: 'NETWORK_ERROR',
    status: 503,
    fallback: 'Network request failed'
  },
  {
    match: asMaybeObsoleteApiError,
    code: 'OBSOLETE_API',
    status: 426,
    fallback: 'This API version is no longer supported'
  },
  {
    match: asMaybeSwapAboveLimitError,
    code: 'SWAP_ABOVE_LIMIT',
    status: 422,
    fallback: 'Amount is above the exchange maximum',
    details: error => ({
      swapPluginId: error.swapPluginId,
      nativeMax: error.nativeMax,
      direction: error.direction
    })
  },
  {
    match: asMaybeSwapBelowLimitError,
    code: 'SWAP_BELOW_LIMIT',
    status: 422,
    fallback: 'Amount is below the exchange minimum',
    details: error => ({
      swapPluginId: error.swapPluginId,
      nativeMin: error.nativeMin,
      direction: error.direction
    })
  },
  {
    match: asMaybeSwapCurrencyError,
    code: 'SWAP_CURRENCY',
    status: 422,
    fallback: 'The exchange does not support this currency pair',
    details: error => ({
      pluginId: error.pluginId,
      fromTokenId: error.fromTokenId,
      toTokenId: error.toTokenId
    })
  },
  {
    match: asMaybeSwapPermissionError,
    code: 'SWAP_PERMISSION',
    status: 403,
    fallback: 'The exchange refused this request',
    details: error => ({ pluginId: error.pluginId, reason: error.reason })
  },
  {
    match: asMaybeSwapAddressError,
    code: 'SWAP_ADDRESS',
    status: 422,
    fallback: 'The exchange refused this address',
    details: error => ({
      swapPluginId: error.swapPluginId,
      reason: error.reason
    })
  },
  {
    match: asMaybeSameCurrencyError,
    code: 'SAME_CURRENCY',
    status: 400,
    fallback: 'Cannot exchange a currency for itself'
  }
]

function mapCoreError(error: unknown): ErrorResponse | undefined {
  for (const arm of CORE_ERROR_ARMS) {
    const matched = arm.match(error)
    if (matched == null) continue
    // An all-undefined projection is omitted, not sent as `{}`: several arms
    // promise fields core may not have set, and `details: {}` tells a caller
    // there is detail when there is none.
    const projected = arm.details?.(matched)
    const details =
      projected != null &&
      Object.values(projected).some(value => value !== undefined)
        ? projected
        : undefined
    return {
      status: arm.status,
      body: {
        error: {
          code: arm.code,
          message:
            arm.message?.(matched) ?? messageOr(matched.message, arm.fallback),
          status: arm.status,
          ...(details != null ? { details } : {})
        }
      }
    }
  }
  return undefined
}
