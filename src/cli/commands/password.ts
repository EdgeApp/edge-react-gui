import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

const passwordSetupCmd = command(
  'password-setup',
  {
    usage: 'password-setup <password>',
    help: 'Create or change the account password',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(passwordSetupCmd)
    const [password] = argv
    const sessionId = requireSession(ctx)
    await ctx.client.put(
      `/v1/accounts/${encodeURIComponent(sessionId)}/password`,
      { password }
    )
    printJson({ ok: true })
  }
)
