import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const passwordSetupCmd = command(
  'change-password',
  {
    usage: 'change-password --password=<password>',
    help: 'Create or change the account password',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordSetupCmd, argv, {
      positional: 'none',
      flags: { password: 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/accounts/${encodeURIComponent(sessionId)}/change-password`,
      { password: args.requireString('password') }
    )
    printJson({ ok: true })
  }
)
