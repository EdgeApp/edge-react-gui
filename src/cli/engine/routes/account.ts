import type { Router } from '../router'
import { getAccount, getSession } from './helpers'

export function registerAccountRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}', ctx => {
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

  router.add('DELETE', '/v1/accounts/{sessionId}', async ctx => {
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  })

  router.add('POST', '/v1/accounts/{sessionId}/touch', ctx => {
    return ctx.state.sessions.touch(ctx.params.sessionId)
  })

  router.add('GET', '/v1/accounts/{sessionId}/login-key', async ctx => {
    const account = getAccount(ctx)
    return { loginKey: await account.getLoginKey() }
  })

  router.add('POST', '/v1/accounts/{sessionId}/sync', async ctx => {
    const account = getAccount(ctx)
    await account.sync()
    return { ok: true }
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/remote', async ctx => {
    const account = getAccount(ctx)
    await account.deleteRemoteAccount()
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  })
}
