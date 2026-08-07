import { printJson } from '../client/output'
import { command, requireSession } from '../command'

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
