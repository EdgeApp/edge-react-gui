import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

function accountPath(sessionId: string, suffix: string): string {
  return `/account/${encodeURIComponent(sessionId)}${suffix}`
}

const deleteRemoteCmd = command(
  'delete-remote-account',
  {
    usage: 'delete-remote-account --yes',
    help: 'Permanently delete the remote account (account.deleteRemoteAccount)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(deleteRemoteCmd, argv, {
      positional: 'none',
      flags: { yes: 'boolean' }
    })
    // The endpoint has no guard, so the guard lives here: this is
    // irreversible and takes the account's funds with it.
    if (!args.boolean('yes')) {
      throw new UsageError(
        deleteRemoteCmd,
        'delete-remote-account is irreversible; pass --yes to confirm'
      )
    }
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/delete-remote-account'))
    ctx.setSessionId(null)
    printJson({ ok: true })
  }
)
