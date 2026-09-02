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
      `/account/${encodeURIComponent(sessionId)}/change-password`,
      { password: args.requireString('password') }
    )
    printJson({ ok: true })
  }
)

command(
  'delete-password',
  {
    usage: 'delete-password',
    help: 'Remove password login (account.deletePassword)',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/delete-password`
    )
    printJson({ ok: true })
  }
)

const checkPasswordCmd = command(
  'check-password',
  {
    usage: 'check-password --password=<password>',
    help: 'Verify a password without changing it (account.checkPassword)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(checkPasswordCmd, argv, {
      positional: 'none',
      flags: { password: 'string' }
    })
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/account/${encodeURIComponent(sessionId)}/check-password`,
        { password: args.requireString('password') }
      )
    )
  }
)
