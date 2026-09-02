import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import {
  optionalQueryString,
  requireQueryString,
  requireString
} from './helpers'

export function registerContextRoutes(router: Router): void {
  /** context.localUsers */
  router.add('GET', '/local-users', ctx => {
    return { localUsers: ctx.state.core.context.localUsers }
  })

  /** context.forgetAccount(rootLoginId) */
  router.add('POST', '/forget-account', async ctx => {
    const body = requireBodyObject(ctx.body)
    const rootLoginId = requireString(body, 'rootLoginId')
    const { context } = ctx.state.core
    // Core takes a rootLoginId. A username is accepted as a convenience so the
    // caller does not have to hash it first, and is resolved locally.
    const found = context.localUsers.find(
      user => user.loginId === rootLoginId || user.username === rootLoginId
    )
    if (found == null) {
      throw engineError(
        'USER_NOT_FOUND',
        `No local user matching: ${rootLoginId}`,
        404
      )
    }
    await context.forgetAccount(found.loginId)
    return undefined
  })

  /** context.usernameAvailable(username, { challengeId }) */
  router.add('GET', '/username-available', async ctx => {
    const username = requireQueryString(ctx.query, 'username')
    const challengeId = optionalQueryString(ctx.query, 'challengeId')
    const available = await ctx.state.core.context.usernameAvailable(username, {
      challengeId
    })
    return { username, available }
  })

  /** context.fixUsername(username) */
  router.add('GET', '/fix-username', ctx => {
    const username = requireQueryString(ctx.query, 'username')
    return { username: ctx.state.core.context.fixUsername(username) }
  })

  /** context.checkPasswordRules(password) */
  router.add('GET', '/check-password-rules', ctx => {
    const password = requireQueryString(ctx.query, 'password')
    return ctx.state.core.context.checkPasswordRules(password)
  })

  /** context.fetchLoginMessages() */
  router.add('GET', '/fetch-login-messages', async ctx => {
    return await ctx.state.core.context.fetchLoginMessages()
  })

  /** context.requestOtpReset(username, otpResetToken) */
  router.add('POST', '/request-otp-reset', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = requireString(body, 'username')
    const otpResetToken = requireString(body, 'otpResetToken')
    const resetDate = await ctx.state.core.context.requestOtpReset(
      username,
      otpResetToken
    )
    return { resetDate: resetDate.toISOString() }
  })

  /** context.fetchRecovery2Questions(recoveryKey, username) */
  router.add('GET', '/fetch-recovery-questions', async ctx => {
    const recoveryKey = requireQueryString(ctx.query, 'recoveryKey')
    const username = requireQueryString(ctx.query, 'username')
    const questions = await ctx.state.core.context.fetchRecovery2Questions(
      recoveryKey,
      username
    )
    return { questions }
  })

  /** context.fetchChallenge() */
  router.add('POST', '/fetch-challenge', async ctx => {
    return await ctx.state.core.context.fetchChallenge()
  })

  /** Engine view of the enabled currency plugins, for create-currency-wallet. */
  router.add('GET', '/currency-configs', ctx => {
    // Wallet-create only accepts currency/accountbased plugins — not swap.
    return { pluginIds: ctx.state.core.currencyPluginIds }
  })
}
