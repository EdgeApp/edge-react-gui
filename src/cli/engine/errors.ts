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

export function toErrorBody(error: unknown): {
  status: number
  body: {
    error: {
      code: string
      message: string
      status: number
      details?: Record<string, unknown>
    }
  }
} {
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

function mapCoreError(error: unknown): {
  status: number
  body: {
    error: {
      code: string
      message: string
      status: number
      details?: Record<string, unknown>
    }
  }
} | null {
  const challenge = asMaybeChallengeError(error)
  if (challenge != null) {
    const challengeId = challenge.challengeId
    const challengeUri = challenge.challengeUri
    const messageParts = [
      challenge.message !== '' && challenge.message != null
        ? challenge.message
        : 'Login requires a CAPTCHA challenge',
      challengeId != null ? `challengeId=${challengeId}` : null,
      challengeUri != null ? `challengeUri=${challengeUri}` : null,
      'Retry the same request with body/query challengeId after solving, or use CLI --solve-captcha.'
    ].filter((part): part is string => part != null && part !== '')
    return {
      status: 403,
      body: {
        error: {
          code: 'CHALLENGE_REQUIRED',
          message: messageParts.join(' '),
          status: 403,
          details: {
            challengeId,
            challengeUri
          }
        }
      }
    }
  }

  const password = asMaybePasswordError(error)
  if (password != null) {
    return {
      status: 401,
      body: {
        error: {
          code: 'PASSWORD_ERROR',
          message: password.message,
          status: 401,
          details: password.wait != null ? { wait: password.wait } : undefined
        }
      }
    }
  }

  const otp = asMaybeOtpError(error)
  if (otp != null) {
    return {
      status: 401,
      body: {
        error: {
          code: 'OTP_REQUIRED',
          message: otp.message,
          status: 401,
          details: {
            reason: otp.reason,
            loginId: otp.loginId,
            resetDate: otp.resetDate?.toISOString(),
            resetToken: otp.resetToken,
            voucherId: otp.voucherId,
            voucherAuth: otp.voucherAuth,
            voucherActivates: otp.voucherActivates?.toISOString()
          }
        }
      }
    }
  }

  const username = asMaybeUsernameError(error)
  if (username != null) {
    return {
      status: 400,
      body: {
        error: {
          code: 'USERNAME_ERROR',
          message: username.message,
          status: 400
        }
      }
    }
  }

  const pinDisabled = asMaybePinDisabledError(error)
  if (pinDisabled != null) {
    return {
      status: 403,
      body: {
        error: {
          code: 'PIN_DISABLED',
          message: pinDisabled.message,
          status: 403
        }
      }
    }
  }

  const insufficient = asMaybeInsufficientFundsError(error)
  if (insufficient != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: insufficient.message,
          status: 422,
          details: {
            tokenId: insufficient.tokenId,
            networkFee: insufficient.networkFee
          }
        }
      }
    }
  }

  const dust = asMaybeDustSpendError(error)
  if (dust != null) {
    return {
      status: 422,
      body: {
        error: { code: 'DUST_SPEND', message: dust.message, status: 422 }
      }
    }
  }

  const pending = asMaybePendingFundsError(error)
  if (pending != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'PENDING_FUNDS',
          message: pending.message,
          status: 422
        }
      }
    }
  }

  const self = asMaybeSpendToSelfError(error)
  if (self != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'SPEND_TO_SELF',
          message: self.message,
          status: 422
        }
      }
    }
  }

  const noAmount = asMaybeNoAmountSpecifiedError(error)
  if (noAmount != null) {
    return {
      status: 400,
      body: {
        error: {
          code: 'NO_AMOUNT_SPECIFIED',
          message: noAmount.message,
          status: 400
        }
      }
    }
  }

  const network = asMaybeNetworkError(error)
  if (network != null) {
    return {
      status: 503,
      body: {
        error: {
          code: 'NETWORK_ERROR',
          message: network.message,
          status: 503
        }
      }
    }
  }

  const obsolete = asMaybeObsoleteApiError(error)
  if (obsolete != null) {
    return {
      status: 426,
      body: {
        error: {
          code: 'OBSOLETE_API',
          message: obsolete.message,
          status: 426
        }
      }
    }
  }

  const swapAbove = asMaybeSwapAboveLimitError(error)
  if (swapAbove != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'SWAP_ABOVE_LIMIT',
          message: swapAbove.message,
          status: 422,
          details: {
            swapPluginId: swapAbove.swapPluginId,
            nativeMax: swapAbove.nativeMax,
            direction: swapAbove.direction
          }
        }
      }
    }
  }

  const swapBelow = asMaybeSwapBelowLimitError(error)
  if (swapBelow != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'SWAP_BELOW_LIMIT',
          message: swapBelow.message,
          status: 422,
          details: {
            swapPluginId: swapBelow.swapPluginId,
            nativeMin: swapBelow.nativeMin,
            direction: swapBelow.direction
          }
        }
      }
    }
  }

  const swapCurrency = asMaybeSwapCurrencyError(error)
  if (swapCurrency != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'SWAP_CURRENCY',
          message: swapCurrency.message,
          status: 422,
          details: {
            pluginId: swapCurrency.pluginId,
            fromTokenId: swapCurrency.fromTokenId,
            toTokenId: swapCurrency.toTokenId
          }
        }
      }
    }
  }

  const swapPerm = asMaybeSwapPermissionError(error)
  if (swapPerm != null) {
    return {
      status: 403,
      body: {
        error: {
          code: 'SWAP_PERMISSION',
          message: swapPerm.message,
          status: 403,
          details: {
            pluginId: swapPerm.pluginId,
            reason: swapPerm.reason
          }
        }
      }
    }
  }

  const swapAddr = asMaybeSwapAddressError(error)
  if (swapAddr != null) {
    return {
      status: 422,
      body: {
        error: {
          code: 'SWAP_ADDRESS',
          message: swapAddr.message,
          status: 422,
          details: {
            swapPluginId: swapAddr.swapPluginId,
            reason: swapAddr.reason
          }
        }
      }
    }
  }

  const sameCurrency = asMaybeSameCurrencyError(error)
  if (sameCurrency != null) {
    return {
      status: 400,
      body: {
        error: {
          code: 'SAME_CURRENCY',
          message: sameCurrency.message,
          status: 400
        }
      }
    }
  }

  return null
}
