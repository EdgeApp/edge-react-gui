import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const pinSetupCmd = command(
  'change-pin',
  {
    usage: 'change-pin --pin=<pin>',
    help: 'Create or change the device PIN',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pinSetupCmd, argv, {
      positional: 'none',
      flags: { pin: 'string' }
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/account/${encodeURIComponent(sessionId)}/change-pin`,
        { pin: args.requireString('pin') }
      )
    )
  }
)

command(
  'delete-pin',
  {
    usage: 'delete-pin',
    help: 'Remove the device PIN',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/delete-pin`
    )
    printJson({ ok: true })
  }
)

command(
  'get-pin',
  {
    usage: 'get-pin',
    help: 'Read the account PIN (account.getPin) — prints secret material',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(`/account/${encodeURIComponent(sessionId)}/get-pin`)
    )
  }
)

const checkPinCmd = command(
  'check-pin',
  {
    usage: 'check-pin --pin=<pin> [--for-duress-account]',
    help: 'Verify a PIN without changing it (account.checkPin)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(checkPinCmd, argv, {
      positional: 'none',
      flags: { pin: 'string', 'for-duress-account': 'boolean' }
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/account/${encodeURIComponent(sessionId)}/check-pin`,
        {
          pin: args.requireString('pin'),
          forDuressAccount: args.boolean('for-duress-account')
        }
      )
    )
  }
)
