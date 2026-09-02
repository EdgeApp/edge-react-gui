import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

command(
  'otp-key',
  {
    usage: 'otp-key',
    help: 'Show OTP (two-factor) status for the current account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(`/account/${encodeURIComponent(sessionId)}/otp-key`)
    )
  }
)

const otpEnableCmd = command(
  'enable-otp',
  {
    usage: 'enable-otp [--timeout=<seconds>]',
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
      await ctx.client.post(
        `/account/${encodeURIComponent(sessionId)}/enable-otp`,
        { timeout }
      )
    )
  }
)

command(
  'disable-otp',
  {
    usage: 'disable-otp',
    help: 'Disable OTP for the current account',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/disable-otp`
    )
    printJson({ ok: true })
  }
)

command(
  'cancel-otp-reset',
  {
    usage: 'cancel-otp-reset',
    help: 'Cancel a pending OTP reset',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/cancel-otp-reset`
    )
    printJson({ ok: true })
  }
)

const otpResetRequestCmd = command(
  'request-otp-reset',
  {
    usage: 'request-otp-reset <username> --otp-reset-token=<token>',
    help: 'Request an OTP reset for a username'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(otpResetRequestCmd, argv, {
      positional: 'required',
      flags: { 'otp-reset-token': 'string' }
    })
    printJson(
      await ctx.client.post('/request-otp-reset', {
        username: args.positional,
        otpResetToken: args.requireString('otp-reset-token')
      })
    )
  }
)

const repairOtpCmd = command(
  'repair-otp',
  {
    usage: 'repair-otp --otp-key=<otpKey>',
    help: 'Re-point the account at a known 2FA secret (account.repairOtp)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(repairOtpCmd, argv, {
      positional: 'none',
      flags: { 'otp-key': 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/repair-otp`,
      { otpKey: args.requireString('otp-key') }
    )
    printJson({ ok: true })
  }
)
