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
  /** context.$internalStuff.authRequest(method, path, body) */
  router.add('POST', '/admin/auth-request', async ctx => {
    const body = requireBodyObject(ctx.body)
    const method = requireString(body, 'method')
    const path = requireString(body, 'path')
    const requestBody = isPlainObject(body.body) ? body.body : undefined
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.authRequest(method, path, requestBody)
  })

  /** context.$internalStuff.hashUsername(username) */
  router.add('GET', '/admin/hash-username', async ctx => {
    const username = requireQueryString(ctx.query, 'username')
    const internal = getInternalStuff(ctx.state.core.context)
    const hash = await internal.hashUsername(username)
    return { loginId: base58.stringify(hash) }
  })

  /** context.$internalStuff.makeLobby(lobbyRequest, period) */
  router.add('POST', '/admin/make-lobby', async ctx => {
    const body = requireBodyObject(ctx.body)
    const lobbyRequest = isPlainObject(body.lobbyRequest)
      ? (body.lobbyRequest as unknown as LobbyRequest)
      : {}
    const period = optionalNumber(body, 'period')
    const internal = getInternalStuff(ctx.state.core.context)
    const lobby = await internal.makeLobby(lobbyRequest, period)
    // A lobby polls the login server until it is closed. Returning only its id
    // would drop the last reference and leave that poll running for the life
    // of the engine, so park it in the handle store and close it on expiry.
    const handle = ctx.state.objects.create({
      kind: 'lobby',
      prefix: 'lobby_',
      value: lobby,
      onExpire: value => {
        value.close()
      }
    })
    return {
      objectId: handle.objectId,
      expiresAt: handle.expiresAt,
      lobbyId: lobby.lobbyId,
      replies: lobby.replies
    }
  })

  /** Releases the parked lobby handle, closing its login-server poll. */
  router.add('POST', '/admin/lobby-handle/{objectId}/delete', async ctx => {
    const deleted = await ctx.state.objects.delete(ctx.params.objectId)
    if (!deleted) {
      throw engineError(
        'OBJECT_NOT_FOUND',
        `No object handle: ${ctx.params.objectId}`,
        404
      )
    }
    return { ok: true }
  })

  /** context.$internalStuff.fetchLobbyRequest(lobbyId) */
  router.add('GET', '/admin/fetch-lobby-request', async ctx => {
    const lobbyId = requireQueryString(ctx.query, 'lobbyId')
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.fetchLobbyRequest(lobbyId)
  })

  /** context.$internalStuff.sendLobbyReply(lobbyId, lobbyRequest, replyData) */
  router.add('POST', '/admin/send-lobby-reply', async ctx => {
    const body = requireBodyObject(ctx.body)
    const lobbyId = requireString(body, 'lobbyId')
    if (!isPlainObject(body.lobbyRequest)) {
      throw engineError(
        'BAD_REQUEST',
        'Missing required field "lobbyRequest"',
        400
      )
    }
    const internal = getInternalStuff(ctx.state.core.context)
    await internal.sendLobbyReply(
      lobbyId,
      body.lobbyRequest as unknown as LobbyRequest,
      body.replyData
    )
    return undefined
  })

  /** context.$internalStuff.syncRepo(syncKey) */
  router.add('POST', '/admin/sync-repo', async ctx => {
    const body = requireBodyObject(ctx.body)
    const syncKey = requireString(body, 'syncKey')
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.syncRepo(base58.parse(syncKey))
  })

  /** context.$internalStuff.getRepoDisklet(syncKey, dataKey).list(path) */
  router.add('GET', '/admin/repo-list', async ctx => {
    const syncKey = requireQueryString(ctx.query, 'syncKey')
    const dataKey = requireQueryString(ctx.query, 'dataKey')
    const path = optionalQueryString(ctx.query, 'path') ?? ''
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    const listing = await disklet.list(path)
    return { listing }
  })

  /** context.$internalStuff.getRepoDisklet(syncKey, dataKey).getText(path) */
  router.add('GET', '/admin/repo-get', async ctx => {
    const syncKey = requireQueryString(ctx.query, 'syncKey')
    const dataKey = requireQueryString(ctx.query, 'dataKey')
    const path = requireQueryString(ctx.query, 'path')
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    const text = await disklet.getText(path)
    return { text }
  })

  /** context.$internalStuff.getRepoDisklet(syncKey, dataKey).setText(path) */
  router.add('POST', '/admin/repo-set', async ctx => {
    const body = requireBodyObject(ctx.body)
    const syncKey = requireString(body, 'syncKey')
    const dataKey = requireString(body, 'dataKey')
    const path = requireString(body, 'path')
    const text = requireString(body, 'text')
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    await disklet.setText(path, text)
    return undefined
  })

  /** context.$internalStuff.getRepoDisklet(syncKey, dataKey).delete(path) */
  router.add('POST', '/admin/repo-delete', async ctx => {
    const body = requireBodyObject(ctx.body)
    const syncKey = requireString(body, 'syncKey')
    const dataKey = requireString(body, 'dataKey')
    const path = requireString(body, 'path')
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    await disklet.delete(path)
    return undefined
  })
}
