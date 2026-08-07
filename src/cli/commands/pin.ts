import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

const pinSetupCmd = command(
  'pin-setup',
  {
    usage: 'pin-setup <pin>',
    help: 'Create or change the device PIN',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(pinSetupCmd)
    const [pin] = argv
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.put(
        `/v1/accounts/${encodeURIComponent(sessionId)}/pin`,
        {
          pin
        }
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
