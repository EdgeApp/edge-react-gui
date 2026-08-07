import { base58 } from '../encoding'
import { engineError } from '../errors'
import { getInternalStuff, type LobbyRequest } from '../internal'
import { requireBodyObject, type Router } from '../router'
import {
  optionalNumber,
  optionalQueryString,
  requireQueryString,
  requireString
} from './helpers'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function registerAdminRoutes(router: Router): void {
  router.add('POST', '/v1/admin/auth-request', async ctx => {
    const body = requireBodyObject(ctx.body)
    const method = requireString(body, 'method')
    const path = requireString(body, 'path')
    const requestBody = isPlainObject(body.body) ? body.body : undefined
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.authRequest(method, path, requestBody)
  })

  router.add('GET', '/v1/admin/hash-username', async ctx => {
    const username = requireQueryString(ctx.query, 'username')
    const internal = getInternalStuff(ctx.state.core.context)
    const hash = await internal.hashUsername(username)
    return { loginId: base58.stringify(hash) }
  })

  router.add('POST', '/v1/admin/lobby', async ctx => {
    const body = requireBodyObject(ctx.body)
    const lobbyRequest = isPlainObject(body.lobbyRequest)
      ? (body.lobbyRequest as unknown as LobbyRequest)
      : {}
    const period = optionalNumber(body, 'period')
    const internal = getInternalStuff(ctx.state.core.context)
    const lobby = await internal.makeLobby(lobbyRequest, period)
    return { lobbyId: lobby.lobbyId, replies: lobby.replies }
  })

  router.add('GET', '/v1/admin/lobby/{lobbyId}', async ctx => {
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.fetchLobbyRequest(ctx.params.lobbyId)
  })

  router.add('POST', '/v1/admin/lobby/{lobbyId}/reply', async ctx => {
    const body = requireBodyObject(ctx.body)
    if (!isPlainObject(body.lobbyRequest)) {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "lobbyRequest"',
        400
      )
    }
    const internal = getInternalStuff(ctx.state.core.context)
    await internal.sendLobbyReply(
      ctx.params.lobbyId,
      body.lobbyRequest as unknown as LobbyRequest,
      body.replyData
    )
    return undefined
  })

  router.add('POST', '/v1/admin/repos/sync', async ctx => {
    const body = requireBodyObject(ctx.body)
    const syncKey = requireString(body, 'syncKey')
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.syncRepo(base58.parse(syncKey))
  })

  router.add('GET', '/v1/admin/repos/{syncKey}/{dataKey}/files', async ctx => {
    const path = optionalQueryString(ctx.query, 'path') ?? ''
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(ctx.params.syncKey),
      base58.parse(ctx.params.dataKey)
    )
    const listing = await disklet.list(path)
    return { listing }
  })

  router.add('GET', '/v1/admin/repos/{syncKey}/{dataKey}/file', async ctx => {
    const path = requireQueryString(ctx.query, 'path')
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(ctx.params.syncKey),
      base58.parse(ctx.params.dataKey)
    )
    const text = await disklet.getText(path)
    return { text }
  })

  router.add('PUT', '/v1/admin/repos/{syncKey}/{dataKey}/file', async ctx => {
    const path = requireQueryString(ctx.query, 'path')
    const body = requireBodyObject(ctx.body)
    const text = requireString(body, 'text')
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(ctx.params.syncKey),
      base58.parse(ctx.params.dataKey)
    )
    await disklet.setText(path, text)
    return undefined
  })

  router.add(
    'DELETE',
    '/v1/admin/repos/{syncKey}/{dataKey}/file',
    async ctx => {
      const path = requireQueryString(ctx.query, 'path')
      const internal = getInternalStuff(ctx.state.core.context)
      const disklet = await internal.getRepoDisklet(
        base58.parse(ctx.params.syncKey),
        base58.parse(ctx.params.dataKey)
      )
      await disklet.delete(path)
      return undefined
    }
  )
}
