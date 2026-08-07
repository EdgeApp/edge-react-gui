import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

const passwordSetupCmd = command(
  'password-setup',
  {
    usage: 'password-setup --password=<password>',
    help: 'Create or change the account password',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordSetupCmd, argv, {
      positional: 'none',
      flags: { password: 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.put(
      `/v1/accounts/${encodeURIComponent(sessionId)}/password`,
      { password: args.requireString('password') }
    )
    printJson({ ok: true })
  }
)
