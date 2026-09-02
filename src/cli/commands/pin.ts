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
        `/accounts/${encodeURIComponent(sessionId)}/change-pin`,
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
      `/accounts/${encodeURIComponent(sessionId)}/delete-pin`
    )
    printJson({ ok: true })
  }
)
