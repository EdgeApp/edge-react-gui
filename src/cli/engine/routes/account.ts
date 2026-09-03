/**
 * Account-scoped calls, addressed by `sessionId`.
 */
import { route } from '../route'

/**
 * Log out.
 *
 * Ends the session and drops it from the engine.
 */
export const logout = route({
  core: 'account.logout',
  method: 'POST',
  path: '/account/{sessionId}/logout',
  cli: {
    command: 'logout',
    custom: true,
    notes: 'Also clears the stored id from `session.json`.'
  },

  async handler(ctx) {
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  }
})
