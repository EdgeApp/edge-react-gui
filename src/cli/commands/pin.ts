import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const pinSetupCmd = command(
  'pin-setup',
  {
    usage: 'pin-setup --pin=<pin>',
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
      await ctx.client.put(
        `/v1/accounts/${encodeURIComponent(sessionId)}/pin`,
        { pin: args.requireString('pin') }
      )
    )
  }
)

command(
  'pin-delete',
  {
    usage: 'pin-delete',
    help: 'Remove the device PIN',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.delete(`/v1/accounts/${encodeURIComponent(sessionId)}/pin`)
    printJson({ ok: true })
  }
)
