import {
  asArray,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'
import { asEdgeLobbyRequest, type EdgeLobbyRequest } from 'edge-core-js'
import { base64 } from 'rfc4648'

import { base58 } from '../../../util/encoding'
import { isMissingFile } from '../../../util/predicates'
import { doc } from '../doc'
import { EngineError, engineError, errorMessage } from '../errors'
import { getInternalStuff } from '../internal'
import { route } from '../route'
import { asCoreValue, asMinSeconds, asOk } from '../schemas'

/**
 * What a caller may put in a lobby it is creating.
 *
 * Core's `EdgeLobbyRequest` is the shape of a lobby that *exists*, so it
 * requires `publicKey`; `makeLobby` generates that keypair itself and writes
 * the field over whatever it was handed. These are the two fields it reads.
 */
const asLobbyRequestDraft = asObject({
  timeout: asOptional(
    doc(asNumber, 'How long the lobby lives on the login server, in seconds.')
  ),
  loginRequest: asOptional(
    doc(
      asObject({
        appId: doc(asString, 'The app asking for the login.')
      }).withRest,
      'Present when the lobby is a login request.'
    )
  )
}).withRest

/**
 * A lobby request as it travels: `admin-fetch-lobby-request`'s answer, fed
 * back unchanged.
 *
 * Declared here rather than as core's `asEdgeLobbyRequest`, because that
 * cleaner's output has `publicKey: Uint8Array` and the reference could print
 * no schema for it — so nothing said the one required field was a base64
 * string. The handler decodes with core's cleaner (`decodeLobbyRequest`).
 */
const asLobbyRequestWire = asObject({
  publicKey: doc(
    asString,
    'Base64 of the lobby\u2019s compressed secp256k1 public key, exactly as `admin-fetch-lobby-request` publishes it. The reply is encrypted to it.'
  ),
  timeout: asOptional(
    doc(asNumber, 'How long the lobby lives on the login server, in seconds.')
  ),
  loginRequest: asOptional(
    doc(
      asObject({
        appId: doc(asString, 'The app asking for the login.')
      }).withRest,
      'Present when the lobby is a login request.'
    )
  )
}).withRest

/**
 * The wire request as core's `EdgeLobbyRequest`, with `publicKey` decoded.
 *
 * Core destructures `publicKey` straight into `encryptLobbyReply` →
 * `deriveSharedKey` → `secp256k1.keyFromPublic`, where it must be the
 * `Uint8Array` its type declares; a base64 string threw `Unknown point
 * format` as a `500`. Exported for its test.
 */
export function decodeLobbyRequest(raw: unknown): EdgeLobbyRequest {
  try {
    return asEdgeLobbyRequest(raw)
  } catch (error: unknown) {
    throw engineError(
      'BAD_REQUEST',
      `lobbyRequest is not a lobby request: ${errorMessage(error)}`,
      400
    )
  }
}

/**
 * The two keys that open a repo, which travel in a body.
 *
 * `dataKey` is a full offline read of an account's repository, so it does
 * not go in a URL: a query string is written down by everything that touches
 * it, which is why this engine's own log redacts query *values*
 * (`server.ts`'s `redactUrl`). `admin-repo-list` and `admin-repo-get` were
 * `GET` with both keys in the query; they are `POST` with both in the body,
 * like the two write routes that always were. `syncKey` stays the command's
 * positional, because it names the repo rather than opening it.
 */
// Written out rather than built from a shared const: `extractRoutes` reads a
// `doc()` string through the TypeScript checker as a *literal*, so an
// interpolated template drops the description from the reference entirely —
// which `docs:api:contracts` catches.
const REPO_KEYS = {
  syncKey: doc(
    asString,
    'Repo sync key, base58 or base64 \u2014 either, because the only route that produces this value, `get-raw-private-key`, emits it base64 while core\u2019s own repo APIs take base58, and nothing in the CLI converted between them. Base58 is tried first.'
  ),
  dataKey: doc(
    asString,
    'Repo data key, base58 or base64, for the reason `syncKey` gives: `get-raw-private-key` emits it base64. Base58 is tried first.'
  )
}

/**
 * One repo key, in either alphabet, refused as bad argv rather than as an
 * engine fault.
 *
 * `base58` here is the `base-x` wrapper in `src/util/encoding.ts`, whose
 * `parse` throws a plain `Error('Non-base58 character')`. Nine call sites
 * across these six routes passed a caller's typo straight into it, so
 * `admin-sync-repo --sync-key=abc0OIl` answered `500 INTERNAL_ERROR` and the
 * `BAD_REQUEST` every one of them declares was unreachable from its own
 * handler. `signBytes` already does exactly this for `base64.parse`; these
 * were missed.
 *
 * Base64 as well as base58, because the whole group was undrivable from the
 * CLI's own output: `get-raw-private-key` is the only command that produces
 * a `syncKey` or a `dataKey` and it emits both base64 — 28 and 44 characters
 * with `+`, `/` and `=` in them — so feeding either straight to
 * `admin-repo-list` was `400 BAD_REQUEST "must be valid base58"`, and the
 * five commands the guide points at for repo debugging needed an external
 * encoder to use at all. Base58 is tried first, since that is what core's
 * own APIs take and what these routes have always documented.
 */
function parseKey(value: string, field: string): Uint8Array {
  try {
    return base58.parse(value)
  } catch (base58Error: unknown) {
    try {
      return base64.parse(value)
    } catch {
      // The base58 message, because that is the encoding the field is
      // documented in first and the one a hand-typed key is meant to be.
      throw engineError(
        'BAD_REQUEST',
        `${field} must be valid base58 or base64: ${errorMessage(base58Error)}`,
        400
      )
    }
  }
}

/**
 * Raw login-server request.
 *
 * Sends an arbitrary request with the context's credentials attached.
 * Debugging only — this is core's private surface.
 *
 * @note `path` is relative to the login server's `/api`, which core prefixes
 *   itself. A path that starts with `/api` therefore reaches
 *   `/api/api/…` and the server answers "Unknown API endpoint", which
 *   arrives as a `500` rather than as the caller's mistake it is.
 * @note Whatever the login server refuses arrives as `500 INTERNAL_ERROR`,
 *   because core's `authRequest` throws untyped: this route is a tunnel, so
 *   the engine has no table for the far end's failures. Read the message.
 */
export const adminAuthRequest = route({
  core: 'context.$internalStuff.authRequest',
  method: 'POST',
  path: '/admin/auth-request',
  cli: 'admin-auth-request',
  body: asObject({
    method: doc(asString, 'HTTP method, e.g. `GET`.'),
    path: doc(
      asString,
      'Login-server path below `/api`, not an engine path: core prefixes `/api` itself, so `/v2/messages` reaches `/api/v2/messages` and `/api/v2/messages` reaches `/api/api/v2/messages` \u2014 which the server refuses as an unknown endpoint, through an untyped throw this route reported as a `500`.'
    ),
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
 * Reproduces the login server's username hash — `userId`, the key the server
 * files an account's stash under — offline.
 *
 * @note This is **not** a `loginId`. It was published as one, and it is not
 *   interchangeable with the `rootLoginId` from a login, the `loginId` from
 *   `local-users`, or the id `forget-account` and `login-with-key
 *   --use-login-id` take: core moved to a random `loginId` and kept the
 *   username hash as `userId`, so passing this value to either of those
 *   fails — `404 USER_NOT_FOUND` and a stash that cannot be found. Use
 *   `local-users` for a login id.
 */
export const adminHashUsername = route({
  core: 'context.$internalStuff.hashUsername',
  method: 'GET',
  path: '/admin/hash-username',
  cli: 'admin-hash-username',
  query: asObject({ username: doc(asString, 'The name to hash.') }).withRest,
  returns: asObject({
    userId: doc(
      asString,
      'Base58. The login server\u2019s hash of the username, which is what it keys an account\u2019s stash by \u2014 not a `loginId`. This field was called `loginId`, which made it look interchangeable with every other login id in the API; it is not, and the only thing the route is for is reproducing the server\u2019s hash.'
    )
  }),

  async handler(ctx) {
    const { username } = ctx.query.valid
    const internal = getInternalStuff(ctx.state.core.context)
    const hash = await internal.hashUsername(username)
    return { userId: base58.stringify(hash) }
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
    // No fallback here: a nested optional with one is published with no
    // fields at all, because its type is inferred from the `{}` default.
    // The handler defaults it instead.
    lobbyRequest: asOptional(
      doc(
        asLobbyRequestDraft,
        'What the lobby should hold. Defaults to `{}`. `publicKey` is not among the fields: core generates the lobby\u2019s keypair itself and writes that field over whatever it was handed, so a caller creating a lobby has only these two to say.'
      )
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
        'Poll interval in seconds. At least 0.25 and at most 2147483 (about 24.8 days); the engine converts to the milliseconds core takes, and Node holds a timer delay in a 32-bit signed int — above that it clamps to 1ms, so the longest interval a caller could ask for became the fastest poll the loop could make.'
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
      ctx.body.lobbyRequest ?? {},
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
    const deleted = await ctx.state.objects.release(ctx.params.objectId)
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
    // The wire shape, so the reference says what to send; the handler
    // decodes it with core's own cleaner. `asObject(asUnknown)` plus a cast
    // meant this route could not succeed for *any* input — see
    // `decodeLobbyRequest`.
    lobbyRequest: doc(
      asLobbyRequestWire,
      'The object from `admin-fetch-lobby-request`, unchanged.'
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
      decodeLobbyRequest(body.lobbyRequest),
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
    const { syncKey } = ctx.body
    const internal = getInternalStuff(ctx.state.core.context)
    return await internal.syncRepo(parseKey(syncKey, 'syncKey'))
  }
})

/**
 * List repo contents.
 */
export const adminRepoList = route({
  core: 'context.$internalStuff.getRepoDisklet',
  method: 'POST',
  path: '/admin/repo-list',
  cli: { command: 'admin-repo-list', positional: 'syncKey' },
  body: asObject({
    ...REPO_KEYS,
    path: asOptional(doc(asString, 'Subdirectory. Defaults to the repo root.'))
  }).withRest,
  returns: asObject({
    listing: doc(asCoreValue, 'Path to entry type: `file` or `folder`.')
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const { syncKey, dataKey } = ctx.body
    const path = ctx.body.path ?? ''
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      parseKey(syncKey, 'syncKey'),
      parseKey(dataKey, 'dataKey')
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
  method: 'POST',
  path: '/admin/repo-get',
  cli: { command: 'admin-repo-get', positional: 'syncKey' },
  body: asObject({
    ...REPO_KEYS,
    path: doc(asString, 'Path within the repo.')
  }).withRest,
  returns: asObject({ text: doc(asString, 'The file contents.') }),
  errors: ['NOT_FOUND', 'BAD_REQUEST'],

  async handler(ctx) {
    const { syncKey, dataKey, path } = ctx.body
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      parseKey(syncKey, 'syncKey'),
      parseKey(dataKey, 'dataKey')
    )
    // `disklet.getText` rejects an absent file with a plain `Error`, which
    // would fall through as `500 INTERNAL_ERROR` on a route that declares
    // `NOT_FOUND` and never produced it. `dataStore.ts` closes the same gap
    // the same way.
    try {
      const text = await disklet.getText(path)
      return { text }
    } catch (error: unknown) {
      if (error instanceof EngineError) throw error
      if (!isMissingFile(error)) throw error
      throw engineError('NOT_FOUND', `No file ${path} in that repo`, 404)
    }
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
    const { syncKey, dataKey, path, text } = ctx.body
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      parseKey(syncKey, 'syncKey'),
      parseKey(dataKey, 'dataKey')
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
    const { syncKey, dataKey, path } = ctx.body
    const internal = getInternalStuff(ctx.state.core.context)
    const disklet = await internal.getRepoDisklet(
      parseKey(syncKey, 'syncKey'),
      parseKey(dataKey, 'dataKey')
    )
    await disklet.delete(path)
    return undefined
  }
})
