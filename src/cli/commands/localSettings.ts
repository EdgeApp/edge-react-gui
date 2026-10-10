import { printJson } from '../client/output'
import { command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'
import { accountPath } from './paths'

/**
 * One command over two routes: reading with no flag, writing with one. That
 * dispatch is why this is hand-written rather than generated.
 */
const localSettingsCmd = command(
  'local-settings',
  {
    usage: 'local-settings [--spam-filter-on=true|false]',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(localSettingsCmd, argv, {
      flags: { 'spam-filter-on': 'boolstr' }
    })
    const sessionId = requireSession(ctx)
    const spamFilterOn = args.boolstr('spam-filter-on')
    if (spamFilterOn == null) {
      printJson(await ctx.client.get(accountPath(sessionId, '/local-settings')))
      return
    }
    printJson(
      await ctx.client.post(accountPath(sessionId, '/change-local-settings'), {
        spamFilterOn
      })
    )
  }
)
