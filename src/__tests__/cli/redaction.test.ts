import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { OtpError } from 'edge-core-js'

import { ApiClientError } from '../../cli/client/apiClient'
import { EXIT } from '../../cli/client/exitCodes'
import { printError } from '../../cli/client/output'
import { EngineUnavailableError } from '../../cli/client/spawnEngine'
import { toErrorBody } from '../../cli/engine/errors'

let errors: string[]
let spy: jest.SpiedFunction<typeof console.error>

beforeEach(() => {
  errors = []
  spy = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    errors.push(args.map(String).join(' '))
  })
})
afterEach(() => {
  spy.mockRestore()
})

/** The envelope `printError` wrote. */
function written(): any {
  expect(errors).toHaveLength(1)
  return JSON.parse(errors[0])
}

describe('printError redaction', () => {
  it('replaces the two secrets in OTP details and keeps the rest', () => {
    // These are the only thing stopping a `resetToken` — which starts a 2FA
    // reset on the account — and a `voucherAuth` — which authorises a
    // pending voucher — from reaching a terminal, a shell history or a CI
    // log. Both ride in the details `errors.ts` assembles for OTP_REQUIRED.
    const code = printError(
      new ApiClientError({
        code: 'OTP_REQUIRED',
        message: 'Invalid OTP token',
        status: 401,
        details: {
          reason: 'otp',
          loginId: 'login-id',
          resetDate: '2026-01-01T00:00:00.000Z',
          resetToken: 'SECRET-RESET-TOKEN',
          voucherId: 'voucher-id',
          voucherAuth: 'SECRET-VOUCHER-AUTH',
          voucherActivates: '2026-01-02T00:00:00.000Z'
        }
      })
    )
    const body = written()
    expect(body.error.details.resetToken).not.toBe('SECRET-RESET-TOKEN')
    expect(body.error.details.voucherAuth).not.toBe('SECRET-VOUCHER-AUTH')
    expect(errors[0]).not.toContain('SECRET-RESET-TOKEN')
    expect(errors[0]).not.toContain('SECRET-VOUCHER-AUTH')
    // Everything a caller needs to diagnose it survives.
    expect(body.error.details.reason).toBe('otp')
    expect(body.error.details.loginId).toBe('login-id')
    expect(body.error.details.resetDate).toBe('2026-01-01T00:00:00.000Z')
    expect(body.error.details.voucherId).toBe('voucher-id')
    expect(body.error.details.voucherActivates).toBe('2026-01-02T00:00:00.000Z')
    expect(code).toBe(EXIT.AUTH)
  })

  it('redacts every field OTP_REQUIRED carries that is a credential', () => {
    // Derived from the arm itself, not copied from it. A hand-written list
    // drifts silently: renaming a field in `errors.ts` would leave this
    // asserting a key nothing emits any more, and the test would still
    // pass. Reading the keys back out of `toErrorBody` means a rename fails
    // here or in `errors.test.ts`, which is the point of having both.
    const { body: emittedBody } = toErrorBody(
      new OtpError({
        login_id: 'ZGVhZGJlZWY=',
        otp_reset_auth: 'reset-token',
        reason: 'ip',
        otp_timeout_date: '2026-01-01T00:00:00.000Z',
        voucher_activates: '2026-01-02T00:00:00.000Z',
        voucher_auth: 'dm91Y2hlcg==',
        voucher_id: 'v-1'
      })
    )
    const emitted = Object.keys(emittedBody.error.details ?? {})
    // Seven today. Asserted so a projection that loses a field is a failure
    // here rather than a quietly shorter loop below.
    expect(emitted).toHaveLength(7)
    const secrets = ['resetToken', 'voucherAuth']
    const details: Record<string, unknown> = {}
    for (const key of emitted) details[key] = `value-of-${key}`
    printError(
      new ApiClientError({
        code: 'OTP_REQUIRED',
        message: 'Invalid OTP token',
        status: 401,
        details
      })
    )
    const body = written()
    for (const key of emitted) {
      const kept = body.error.details[key] === `value-of-${key}`
      expect(kept).toBe(!secrets.includes(key))
    }
  })

  it('leaves an error with no details alone', () => {
    const code = printError(
      new ApiClientError({
        code: 'WALLET_NOT_FOUND',
        message: 'No wallet matches that id',
        status: 404
      })
    )
    const body = written()
    expect(body).toStrictEqual({
      error: {
        code: 'WALLET_NOT_FOUND',
        message: 'No wallet matches that id',
        status: 404
      }
    })
    expect(code).toBe(EXIT.NOT_FOUND)
  })

  it('reports a plain Error as INTERNAL_ERROR without a stack', () => {
    const code = printError(new Error('boom'))
    const body = written()
    expect(body.error).toStrictEqual({
      code: 'INTERNAL_ERROR',
      message: 'boom',
      status: 500
    })
    expect(code).toBe(EXIT.GENERIC)
  })

  it('reports a thrown non-Error', () => {
    printError('just a string')
    expect(written().error.message).toBe('just a string')
  })

  // The envelope and exit code the guide's exit-code table publishes for the
  // most common failure a first-time caller meets — and the one `printError`
  // arm that is not an `ApiClientError`, so the 503 rule above it does not
  // reach it. No test constructed this error.
  it('reports an unreachable engine as ENGINE_UNAVAILABLE, exit 7', () => {
    const code = printError(
      new EngineUnavailableError('Engine is not running for profile abc123')
    )
    expect(written().error).toStrictEqual({
      code: 'ENGINE_UNAVAILABLE',
      message: 'Engine is not running for profile abc123',
      status: 503
    })
    expect(code).toBe(EXIT.ENGINE)
  })
})
