import { errorMessage, type ErrorResponse } from '../engine/errors'
import { ApiClientError, ClientRequestError } from './apiClient'
import { EXIT, exitCodeForApiError, printErrorEnvelope } from './exitCodes'
import { EngineUnavailableError } from './spawnEngine'
// Re-exported, so every existing `import { EXIT } from './output'` still
// resolves while the table itself lives in a module the docs build can read.
export { EXIT, exitCodeForApiError } from './exitCodes'

export function printJson(value: unknown): void {
  if (typeof value === 'string') {
    console.log(value)
  } else {
    console.log(JSON.stringify(value, null, 2))
  }
}

/**
 * One object, one line.
 *
 * For a held-open stream, where the documented contract is newline-delimited
 * JSON so `jq -c` and `while read line` work. Pretty-printing spans a frame
 * across a dozen lines, none of which parse on their own.
 */
export function printJsonLine(value: unknown): void {
  console.log(typeof value === 'string' ? value : JSON.stringify(value))
}

/**
 * Bearer values that must not reach a terminal, a shell history or a CI log.
 *
 * `resetToken` starts a 2FA reset on the account and `voucherAuth` authorises
 * acting on a pending voucher. Both ride in the OTP_REQUIRED details so that a
 * program can pass them to `request-otp-reset` or `approve-voucher`, which
 * read them from the REST body — the terminal has no use for either.
 */
const SECRET_DETAIL_FIELDS = ['resetToken', 'voucherAuth']

function redactDetails(
  details: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...details }
  for (const field of SECRET_DETAIL_FIELDS) {
    if (out[field] != null)
      out[field] = '[redacted: read it from the REST body]'
  }
  return out
}

/**
 * Always emit a single JSON object on stderr for machine-readable errors.
 * No prose banners (e.g. CAPTCHA hints).
 */
export function printError(error: unknown): number {
  if (error instanceof ApiClientError) {
    printErrorBody({
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details == null ? undefined : redactDetails(error.details)
    })
    return exitCodeForApiError(error.code, error.status)
  }
  if (error instanceof ClientRequestError) {
    // The client's own deadline, or a connection that went away. Keyed off
    // the type for the reason `EngineUnavailableError` is: the generic arm
    // below publishes `INTERNAL_ERROR` with a fabricated `status: 500`, and
    // `--timeout` is documented as a routine thing to raise.
    printErrorBody({
      code: error.code,
      message: error.message,
      status: error.status
    })
    return exitCodeForApiError(error.code, error.status)
  }
  if (error instanceof EngineUnavailableError) {
    // The documented exit 7. Keyed off the type rather than a regex over the
    // message, which already missed "Engine is up but run file is missing"
    // and would have changed the published contract on any reword.
    printErrorBody({
      code: 'ENGINE_UNAVAILABLE',
      message: error.message,
      status: 503
    })
    return EXIT.ENGINE
  }
  printErrorBody({
    code: 'INTERNAL_ERROR',
    message: errorMessage(error),
    status: 500
  })
  return EXIT.GENERIC
}

/**
 * Write one error envelope to stderr.
 *
 * The writer itself is in `exitCodes.ts`, because `bootNodeLocale.ts` needs
 * it and cannot import this module — that would cycle through `spawnEngine`
 * — and two untyped copies of the envelope were what that produced.
 */
const printErrorBody = (error: ErrorResponse['body']['error']): void => {
  printErrorEnvelope(error)
}
