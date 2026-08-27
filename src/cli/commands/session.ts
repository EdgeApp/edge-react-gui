import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

command(
  'session-list',
  {
    usage: 'session-list',
    help: 'List active engine sessions'
  },
  async ctx => {
    printJson(await ctx.client.get('/v1/sessions'))
  }
)

command(
  'session-touch',
  {
    usage: 'session-touch',
    help: 'Keepalive; refresh the auto-logout timer for the current session',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/v1/accounts/${encodeURIComponent(sessionId)}/touch`
      )
    )
  }
)

const spamFilterCmd = command(
  'spam-filter',
  {
    usage: 'spam-filter [on|off]',
    help: 'Show or set the local “hide spam transactions” toggle',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length > 1) throw new UsageError(spamFilterCmd)
    const sessionId = requireSession(ctx)
    const path = `/v1/accounts/${encodeURIComponent(sessionId)}/local-settings`
    if (argv.length === 0) {
      printJson(await ctx.client.get(path))
      return
    }
    const flag = argv[0]
    if (flag !== 'on' && flag !== 'off') throw new UsageError(spamFilterCmd)
    printJson(await ctx.client.patch(path, { spamFilterOn: flag === 'on' }))
  }
)
