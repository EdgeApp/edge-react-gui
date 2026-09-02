import { requireBodyObject, type Router } from '../router'
import {
  getAccount,
  optionalBoolean,
  optionalString,
  requireString,
  requireStringArray
} from './helpers'

export function registerCredentialsRoutes(router: Router): void {
  /** account.changePassword(password) */
  router.add('POST', '/accounts/{sessionId}/change-password', async ctx => {
    const body = requireBodyObject(ctx.body)
    const password = requireString(body, 'password')
    await getAccount(ctx).changePassword(password)
    return undefined
  })

  /** account.deletePassword() */
  router.add('POST', '/accounts/{sessionId}/delete-password', async ctx => {
    await getAccount(ctx).deletePassword()
    return undefined
  })

  /** account.checkPassword(password) */
  router.add('POST', '/accounts/{sessionId}/check-password', async ctx => {
    const body = requireBodyObject(ctx.body)
    const password = requireString(body, 'password')
    const ok = await getAccount(ctx).checkPassword(password)
    return { ok }
  })

  /** account.getPin() */
  router.add('GET', '/accounts/{sessionId}/get-pin', async ctx => {
    const pin = await getAccount(ctx).getPin()
    return { pin: pin ?? null }
  })

  /** account.changePin(opts) */
  router.add('POST', '/accounts/{sessionId}/change-pin', async ctx => {
    const body = requireBodyObject(ctx.body)
    const pin = requireString(body, 'pin')
    const enableLogin = optionalBoolean(body, 'enableLogin')
    const forDuressAccount = optionalBoolean(body, 'forDuressAccount')
    const pin2Key = await getAccount(ctx).changePin({
      pin,
      enableLogin,
      forDuressAccount
    })
    return { pin2Key }
  })

  /** account.deletePin() */
  router.add('POST', '/accounts/{sessionId}/delete-pin', async ctx => {
    await getAccount(ctx).deletePin()
    return undefined
  })

  /** account.checkPin(pin, opts) */
  router.add('POST', '/accounts/{sessionId}/check-pin', async ctx => {
    const body = requireBodyObject(ctx.body)
    const pin = requireString(body, 'pin')
    const forDuressAccount = optionalBoolean(body, 'forDuressAccount')
    const ok = await getAccount(ctx).checkPin(pin, { forDuressAccount })
    return { ok }
  })

  /** account.changeUsername(opts) */
  router.add('POST', '/accounts/{sessionId}/change-username', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = requireString(body, 'username')
    const password = optionalString(body, 'password')
    await getAccount(ctx).changeUsername({ username, password })
    return undefined
  })

  /** account.changeRecovery(questions, answers) */
  router.add('POST', '/accounts/{sessionId}/change-recovery', async ctx => {
    const body = requireBodyObject(ctx.body)
    const questions = requireStringArray(body, 'questions')
    const answers = requireStringArray(body, 'answers')
    const recoveryKey = await getAccount(ctx).changeRecovery(questions, answers)
    return { recoveryKey }
  })

  /** account.deleteRecovery() */
  router.add('POST', '/accounts/{sessionId}/delete-recovery', async ctx => {
    await getAccount(ctx).deleteRecovery()
    return undefined
  })
}
