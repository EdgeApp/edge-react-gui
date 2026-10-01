import { asArray, asObject, asOptional, asString, asUnknown } from 'cleaners'

import { base58 } from '../../../util/encoding'
import { doc } from '../doc'
import { engineError } from '../errors'
import { getInternalStuff, type LobbyRequest } from '../internal'
import { route } from '../route'
import { asCoreValue, asMinSeconds, asOk } from '../schemas'

const REPO_KEYS = {
  syncKey: doc(asString, 'Base58 repo sync key.'),
  dataKey: doc(asString, 'Base58 repo data key.')
}

/**
 * Raw login-server request.
 *
 * Sends an arbitrary request with the context's credentials attached.
 * Debugging only — this is core's private surface.
 */
export const adminAuthRequest = route({
  core: 'context.$internalStuff.authRequest',
  method: 'POST',
  path: '/admin/auth-request',
  cli: 'admin-auth-request',
  body: asObject({
    method: doc(asString, 'HTTP method, e.g. `GET`.'),
    path: doc(asString, 'Login-server path, not an engine path.'),
    // `asObject(asUnknown)`, so a non-object is a 400 naming the field. As
    // `asCoreValue` it was accepted by the declaration and then *dropped* by
    // the handler's `isPlainObject` ternary, which sent the login-server
    // request with no body at all.
    body: asOptional(
      doc(asObject(asUnknown), 'Request body, when the method takes one.')
    )
  }).withRest,
  returns: doc(asCoreValue, 'Whatever the login server returned.'),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const { method, path } = ctx.body
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.authRequest(method, path, ctx.body.body)
  }
})

/**
 * Hash a username.
 *
 * Reproduces the login server's hashing, to derive a login id offline.
 */
export const adminHashUsername = route({
  core: 'context.$internalStuff.hashUsername',
  method: 'GET',
  path: '/admin/hash-username',
  cli: 'admin-hash-username',
  query: asObject({ username: doc(asString, 'The name to hash.') }).withRest,
  returns: asObject({ loginId: doc(asString, 'Base58.') }),

  async handler(ctx) {
    const { username } = ctx.query.valid
    const internal = getInternalStuff(ctx.state.core.context)
    const hash = await internal.hashUsername(username)
    return { loginId: base58.stringify(hash) }
  }
})

/**
 * Create a lobby.
 *
 * A lobby polls the login server until closed, so the engine parks it under a
 * `lobby_` handle and closes it on expiry rather than leaking the poll.
 *
 * @note Release it with `admin-lobby-handle-delete`, or the poll runs for the
 *   full five minutes.
 */
export const adminMakeLobby = route({
  core: 'context.$internalStuff.makeLobby',
  method: 'POST',
  path: '/admin/make-lobby',
  cli: {
    command: 'admin-make-lobby',
    flags: { periodSeconds: { maps: 'period' } }
  },
  body: asObject({
    lobbyRequest: asOptional(
      doc(asObject(asUnknown), 'Defaults to `{}`.'),
      () => ({})
    ),
    // `asCoreValue` plus a `typeof body.period === 'number'` check in the
    // handler meant `{"period":"30"}` over REST was *silently ignored* and
    // the lobby polled at the default rate, while the generated table
    // advertised `--period-seconds='<json>'` where a number belongs.
    //
    // Floored, because core's unit is milliseconds and this field's is
    // seconds: an unbounded value let `--period-seconds=0` poll as fast as
    // the network answers, from a route that needs no session, against
    // Edge's production login server.
    period: asOptional(
      doc(
        asMinSeconds(0.25),
        'Poll interval in seconds. At least 0.25; the engine converts to the milliseconds core takes.'
      )
    )
  }).withRest,
  returns: asObject({
    objectId: doc(asString, 'The parked handle.'),
    expiresAt: doc(
      asString,
      'When the engine closes the lobby and stops polling.'
    ),
    lobbyId: doc(asString, 'Identifies the lobby to the party joining it.'),
    replies: doc(
      asArray(asCoreValue),
      'Empty at creation; re-read to see replies.'
    )
  }),
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    const internal = getInternalStuff(ctx.state.core.context)
    const lobby = await internal.makeLobby(
      ctx.body.lobbyRequest as unknown as LobbyRequest,
      // Seconds in, milliseconds out. Core's `makeLobby` forwards this to
      // `makePeriodicTask`, whose parameter is named `msGap`, so passing the
      // documented `--period-seconds=30` straight through polled
      // `GET /v2/lobby/{id}` every 30 *milliseconds* — about 33 requests a
      // second for the handle's whole five-minute TTL, roughly 10,000
      // requests, with the engine's single event loop saturated throughout.
      ctx.body.period == null ? undefined : Math.round(ctx.body.period * 1000)
    )
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
  }
})

/**
 * Close a parked lobby.
 *
 * @note Not under `/account/{sessionId}/objects/`, because admin lobbies
 *   belong to no session.
 * @coreNote Engine handle store for a lobby created via makeLobby.
 */
export const adminDeleteLobbyHandle = route({
  core: null,
  method: 'POST',
  path: '/admin/lobby-handle/delete',
  cli: { command: 'admin-lobby-handle-delete', positional: 'objectId' },
  returns: asOk,
  errors: ['OBJECT_NOT_FOUND', 'OBJECT_KIND_MISMATCH', 'OBJECT_IN_USE'],

  async handler(ctx) {
    // Only a lobby, and only through `get`, which also refuses a handle that
    // is mid-call. This route needs no session — admin lobbies belong to
    // none — so without the kind filter
    // `POST /admin/lobby-handle/delete/<tx_…>` discarded another session's
    // staged transaction, and `<swap_…>` ran `quote.close()` on its live
    // quote, from an unauthenticated path.
    ctx.state.objects.get(ctx.params.objectId, 'lobby')
    const deleted = await ctx.state.objects.delete(ctx.params.objectId)
    if (!deleted) {
      throw engineError(
        'OBJECT_NOT_FOUND',
        `No object handle: ${ctx.params.objectId}`,
        404
      )
    }
    return { ok: true }
  }
})

/**
 * Read a lobby's contents.
 */
export const adminFetchLobbyRequest = route({
  core: 'context.$internalStuff.fetchLobbyRequest',
  method: 'GET',
  path: '/admin/fetch-lobby-request',
  cli: { command: 'admin-fetch-lobby-request', positional: 'lobbyId' },
  query: asObject({ lobbyId: doc(asString, 'Which lobby to read.') }).withRest,
  returns: doc(asCoreValue, 'The raw lobby request.'),
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    const { lobbyId } = ctx.query.valid
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.fetchLobbyRequest(lobbyId)
  }
})

/**
 * Reply to a lobby.
 */
export const adminSendLobbyReply = route({
  core: 'context.$internalStuff.sendLobbyReply',
  method: 'POST',
  path: '/admin/send-lobby-reply',
  cli: { command: 'admin-send-lobby-reply', positional: 'lobbyId' },
  body: asObject({
    lobbyId: doc(asString, 'Which lobby to answer.'),
    // Declared as an object, so the 400 comes from the declaration with the
    // field named, in one layer rather than two with two messages.
    lobbyRequest: doc(
      asObject(asUnknown),
      'Normally the object from `admin-fetch-lobby-request`.'
    ),
    replyData: asOptional(doc(asCoreValue, 'Payload for the requester.'))
  }).withRest,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const body = ctx.body
    const { lobbyId } = body
    const internal = getInternalStuff(ctx.state.core.context)
    await internal.sendLobbyReply(
      lobbyId,
      body.lobbyRequest as LobbyRequest,
      body.replyData
    )
    return undefined
  }
})

/**
 * Sync a repo.
 */
export const adminSyncRepo = route({
  core: 'context.$internalStuff.syncRepo',
  method: 'POST',
  path: '/admin/sync-repo',
  cli: { command: 'admin-sync-repo', positional: 'syncKey' },
  body: asObject({ syncKey: doc(asString, 'Base58 repo sync key.') }).withRest,
  returns: doc(asCoreValue, 'The changeset summary.'),
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    const body = ctx.body
    const { syncKey } = body
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.syncRepo(base58.parse(syncKey))
  }
})

/**
 * List repo contents.
 */
export const adminRepoList = route({
  core: 'context.$internalStuff.getRepoDisklet',
  method: 'GET',
  path: '/admin/repo-list',
  cli: { command: 'admin-repo-list', positional: 'syncKey' },
  query: asObject({
    ...REPO_KEYS,
    path: asOptional(doc(asString, 'Subdirectory. Defaults to the repo root.'))
  }).withRest,
  returns: asObject({
    listing: doc(asCoreValue, 'Path to entry type: `file` or `folder`.')
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const { syncKey, dataKey } = ctx.query.valid
    const path = ctx.query.valid.path ?? ''
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    const listing = await disklet.list(path)
    return { listing }
  }
})

/**
 * Read a repo file.
 */
export const adminRepoGet = route({
  core: 'context.$internalStuff.getRepoDisklet',
  method: 'GET',
  path: '/admin/repo-get',
  cli: { command: 'admin-repo-get', positional: 'syncKey' },
  query: asObject({
    ...REPO_KEYS,
    path: doc(asString, 'Path within the repo.')
  }).withRest,
  returns: asObject({ text: doc(asString, 'The file contents.') }),
  errors: ['NOT_FOUND', 'BAD_REQUEST'],

  async handler(ctx) {
    const { syncKey, dataKey, path } = ctx.query.valid
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    const text = await disklet.getText(path)
    return { text }
  }
})

/**
 * Write a repo file.
 *
 * Writes directly into a synced repo, bypassing every core-level invariant. A
 * malformed write can break the account for real clients.
 */
export const adminRepoSet = route({
  core: 'context.$internalStuff.getRepoDisklet',
  method: 'POST',
  path: '/admin/repo-set',
  cli: { command: 'admin-repo-set', positional: 'syncKey' },
  body: asObject({
    ...REPO_KEYS,
    path: doc(asString, 'Path within the repo.'),
    text: doc(asString, 'The contents to write.')
  }).withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const body = ctx.body
    const { syncKey, dataKey, path, text } = body
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    await disklet.setText(path, text)
    return undefined
  }
})

/**
 * Delete a repo file.
 *
 * Destructive, and not undoable from this API.
 */
export const adminRepoDelete = route({
  core: 'context.$internalStuff.getRepoDisklet',
  method: 'POST',
  path: '/admin/repo-delete',
  cli: { command: 'admin-repo-delete', positional: 'syncKey' },
  body: asObject({ ...REPO_KEYS, path: doc(asString, 'Path within the repo.') })
    .withRest,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const body = ctx.body
    const { syncKey, dataKey, path } = body
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      base58.parse(syncKey),
      base58.parse(dataKey)
    )
    await disklet.delete(path)
    return undefined
  }
})
