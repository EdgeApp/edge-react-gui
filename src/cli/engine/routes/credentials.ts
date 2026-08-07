import { requireBodyObject, type Router } from '../router'
import { getAccount, requireString, requireStringArray } from './helpers'

export function registerCredentialsRoutes(router: Router): void {
  router.add('PUT', '/v1/accounts/{sessionId}/password', async ctx => {
    const body = requireBodyObject(ctx.body)
    const password = requireString(body, 'password')
    await getAccount(ctx).changePassword(password)
    return undefined
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/password', async ctx => {
    await getAccount(ctx).deletePassword()
    return undefined
  })

  router.add('POST', '/v1/accounts/{sessionId}/password/check', async ctx => {
    const body = requireBodyObject(ctx.body)
    const password = requireString(body, 'password')
    const ok = await getAccount(ctx).checkPassword(password)
    return { ok }
  })

  router.add('GET', '/v1/accounts/{sessionId}/pin', async ctx => {
    const pin = await getAccount(ctx).getPin()
    return { pin: pin ?? null }
  })

  router.add('PUT', '/v1/accounts/{sessionId}/pin', async ctx => {
    const body = requireBodyObject(ctx.body)
    const pin = requireString(body, 'pin')
    const pin2Key = await getAccount(ctx).changePin({ pin })
    return { pin2Key }
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/pin', async ctx => {
    await getAccount(ctx).deletePin()
    return undefined
  })

  router.add('POST', '/v1/accounts/{sessionId}/pin/check', async ctx => {
    const body = requireBodyObject(ctx.body)
    const pin = requireString(body, 'pin')
    const ok = await getAccount(ctx).checkPin(pin)
    return { ok }
  })

  router.add('PUT', '/v1/accounts/{sessionId}/username', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = requireString(body, 'username')
    const password =
      typeof body.password === 'string' ? body.password : undefined
    await getAccount(ctx).changeUsername({ username, password })
    return undefined
  })

  router.add('PUT', '/v1/accounts/{sessionId}/recovery', async ctx => {
    const body = requireBodyObject(ctx.body)
    const questions = requireStringArray(body, 'questions')
    const answers = requireStringArray(body, 'answers')
    const recoveryKey = await getAccount(ctx).changeRecovery(questions, answers)
    return { recoveryKey }
  })

  router.add('DELETE', '/v1/accounts/{sessionId}/recovery', async ctx => {
    await getAccount(ctx).deleteRecovery()
    return undefined
  })
}
