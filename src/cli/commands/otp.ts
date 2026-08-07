import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

command(
  'otp-status',
  {
    usage: 'otp-status',
    help: 'Show OTP (two-factor) status for the current account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(`/v1/accounts/${encodeURIComponent(sessionId)}/otp`)
    )
  }
)

const otpEnableCmd = command(
  'otp-enable',
  {
    usage: 'otp-enable [--timeout=<seconds>]',
    help: 'Enable OTP; optional timeout is the reset window in seconds',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(otpEnableCmd, argv, {
      positional: 'none',
      flags: { timeout: 'string' }
    })
    const sessionId = requireSession(ctx)
    const raw = args.string('timeout')
    let timeout: number | undefined
    if (raw != null) {
      timeout = Number(raw)
      if (!Number.isFinite(timeout)) {
        throw new UsageError(otpEnableCmd, '--timeout must be a number')
      }
    }
    printJson(
      await ctx.client.put(
        `/v1/accounts/${encodeURIComponent(sessionId)}/otp`,
        { timeout }
      )
    )
  }
)

command(
  'otp-disable',
  {
    usage: 'otp-disable',
    help: 'Disable OTP for the current account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.delete(`/v1/accounts/${encodeURIComponent(sessionId)}/otp`)
    printJson({ ok: true })
  }
)

command(
  'otp-reset-cancel',
  {
    usage: 'otp-reset-cancel',
    help: 'Cancel a pending OTP reset',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.delete(
      `/v1/accounts/${encodeURIComponent(sessionId)}/otp/reset`
    )
    printJson({ ok: true })
  }
)

const otpResetRequestCmd = command(
  'otp-reset-request',
  {
    usage: 'otp-reset-request <username> --reset-token=<token>',
    help: 'Request an OTP reset for a username'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(otpResetRequestCmd, argv, {
      positional: 'required',
      flags: { 'reset-token': 'string' }
    })
    printJson(
      await ctx.client.post('/v1/otp-reset', {
        username: args.positional,
        resetToken: args.requireString('reset-token')
      })
    )
  }
)
