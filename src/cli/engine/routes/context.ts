import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import {
  optionalQueryString,
  requireQueryString,
  requireString
} from './helpers'

export function registerContextRoutes(router: Router): void {
  router.add('GET', '/v1/users', ctx => {
    return { users: ctx.state.core.context.localUsers }
  })

  router.add('DELETE', '/v1/users/{loginIdOrUsername}', async ctx => {
    const { loginIdOrUsername } = ctx.params
    const { context } = ctx.state.core
    const found = context.localUsers.find(
      user =>
        user.loginId === loginIdOrUsername ||
        user.username === loginIdOrUsername
    )
    if (found == null) {
      throw engineError(
        'USER_NOT_FOUND',
        `No local user matching: ${loginIdOrUsername}`,
        404
      )
    }
    await context.forgetAccount(found.loginId)
    return undefined
  })

  router.add('GET', '/v1/username-available', async ctx => {
    const username = requireQueryString(ctx.query, 'username')
    const challengeId = optionalQueryString(ctx.query, 'challengeId')
    const available = await ctx.state.core.context.usernameAvailable(username, {
      challengeId
    })
    return { username, available }
  })

  router.add('GET', '/v1/fix-username', ctx => {
    const username = requireQueryString(ctx.query, 'username')
    return { username: ctx.state.core.context.fixUsername(username) }
  })

  router.add('GET', '/v1/password-rules', ctx => {
    const password = requireQueryString(ctx.query, 'password')
    return ctx.state.core.context.checkPasswordRules(password)
  })

  router.add('GET', '/v1/login-messages', async ctx => {
    return await ctx.state.core.context.fetchLoginMessages()
  })

  router.add('POST', '/v1/otp-reset', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = requireString(body, 'username')
    const resetToken = requireString(body, 'resetToken')
    const resetDate = await ctx.state.core.context.requestOtpReset(
      username,
      resetToken
    )
    return { resetDate: resetDate.toISOString() }
  })

  router.add('GET', '/v1/recovery2-questions', async ctx => {
    const recovery2Key = requireQueryString(ctx.query, 'recovery2Key')
    const username = requireQueryString(ctx.query, 'username')
    const questions = await ctx.state.core.context.fetchRecovery2Questions(
      recovery2Key,
      username
    )
    return { questions }
  })

  router.add('POST', '/v1/challenge', async ctx => {
    return await ctx.state.core.context.fetchChallenge()
  })

  router.add('GET', '/v1/currency-configs', ctx => {
    // Wallet-create only accepts currency/accountbased plugins — not swap.
    return { pluginIds: ctx.state.core.currencyPluginIds }
  })
}
