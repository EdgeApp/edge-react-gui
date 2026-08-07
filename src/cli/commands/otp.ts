import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

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
    usage: 'otp-enable [<timeout>]',
    help: 'Enable OTP; optional timeout is the reset window in seconds',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length > 1) throw new UsageError(otpEnableCmd)
    const sessionId = requireSession(ctx)
    let timeout: number | undefined
    if (argv.length === 1) {
      timeout = Number(argv[0])
      if (!Number.isFinite(timeout)) throw new UsageError(otpEnableCmd)
    }
    printJson(
      await ctx.client.put(
        `/v1/accounts/${encodeURIComponent(sessionId)}/otp`,
        {
          timeout
        }
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
    usage: 'otp-reset-request <username> <resetToken>',
    help: 'Request an OTP reset for a username'
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(otpResetRequestCmd)
    const [username, resetToken] = argv
    printJson(await ctx.client.post('/v1/otp-reset', { username, resetToken }))
  }
)
