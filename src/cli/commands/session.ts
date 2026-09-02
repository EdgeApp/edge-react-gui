import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

command(
  'engine-sessions',
  {
    usage: 'engine-sessions',
    help: 'List active engine sessions'
  },
  async ctx => {
    printJson(await ctx.client.get('/engine/sessions'))
  }
)

command(
  'touch',
  {
    usage: 'touch',
    help: 'Keepalive; refresh the auto-logout timer for the current session',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(`/accounts/${encodeURIComponent(sessionId)}/touch`)
    )
  }
)

const spamFilterCmd = command(
  'local-settings',
  {
    usage: 'local-settings [--spam-filter-on=true|false]',
    help: 'Show or set the local “hide spam transactions” toggle',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(spamFilterCmd, argv, {
      positional: 'none',
      flags: { 'spam-filter-on': 'boolstr' }
    })
    const sessionId = requireSession(ctx)
    const path = `/accounts/${encodeURIComponent(sessionId)}/local-settings`
    const spamFilterOn = args.boolstr('spam-filter-on')
    if (spamFilterOn == null) {
      printJson(await ctx.client.get(path))
      return
    }
    printJson(
      await ctx.client.post(
        `/accounts/${encodeURIComponent(sessionId)}/change-local-settings`,
        { spamFilterOn }
      )
    )
  }
)
