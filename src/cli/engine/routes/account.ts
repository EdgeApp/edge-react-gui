import type { Router } from '../router'
import { getAccount, getSession } from './helpers'

export function registerAccountRoutes(router: Router): void {
  /** Engine composite: session registry plus EdgeAccount properties. */
  router.add('GET', '/account/{sessionId}', ctx => {
    const session = getSession(ctx)
    const { account } = session
    const info = ctx.state.sessions.toInfo(session)
    return {
      ...info,
      username: account.username,
      rootLoginId: account.rootLoginId,
      appId: account.appId,
      created: account.created?.toISOString() ?? null,
      lastLogin: account.lastLogin.toISOString(),
      loggedIn: account.loggedIn,
      recoveryKey: account.recoveryKey ?? null,
      otpEnabled: account.otpKey != null,
      otpResetPending: account.otpResetDate != null,
      canDuressLogin: account.canDuressLogin,
      isDuressAccount: account.isDuressAccount,
      edgeLogin: account.edgeLogin,
      keyLogin: account.keyLogin,
      newAccount: account.newAccount,
      passwordLogin: account.passwordLogin,
      pinLogin: account.pinLogin,
      recoveryLogin: account.recoveryLogin
    }
  })

  /** account.logout() */
  router.add('POST', '/account/{sessionId}/logout', async ctx => {
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  })

  /** Engine keepalive; no core equivalent. */
  router.add('POST', '/account/{sessionId}/touch', ctx => {
    return ctx.state.sessions.touch(ctx.params.sessionId)
  })

  /** account.getLoginKey() */
  router.add('GET', '/account/{sessionId}/get-login-key', async ctx => {
    const account = getAccount(ctx)
    return { loginKey: await account.getLoginKey() }
  })

  /** account.sync() */
  router.add('POST', '/account/{sessionId}/sync', async ctx => {
    const account = getAccount(ctx)
    await account.sync()
    return undefined
  })

  /** account.deleteRemoteAccount() */
  router.add(
    'POST',
    '/account/{sessionId}/delete-remote-account',
    async ctx => {
      const account = getAccount(ctx)
      await account.deleteRemoteAccount()
      await ctx.state.sessions.logout(ctx.params.sessionId)
      return undefined
    }
  )
}
