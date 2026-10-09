import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeAccount,
  EdgeAccountOptions,
  EdgePendingEdgeLogin
} from 'edge-core-js'

import { base58 } from '../../../util/encoding'
import { doc } from '../doc'
import { EngineError, engineError, errorMessage } from '../errors'
import { route } from '../route'
import type { RouteContext } from '../router'
import {
  asPendingEdgeLogin,
  asSession,
  asSessionListing,
  type PendingEdgeLogin,
  withoutUndefined
} from '../schemas'
import type { SessionInfo } from '../sessions'

interface PendingRecord {
  pendingId: string
  pending: EdgePendingEdgeLogin
  createdAt: number
  cancelled?: boolean
  /**
   * The session this login created, by id only.
   *
   * A `SessionInfo` snapshot used to be cached here and returned verbatim for
   * the rest of the handle's TTL, so `poll-edge-login` kept reporting a
   * session the engine had already discarded — and its `expiresAt` and
   * `lastActivityAt` were frozen at creation, so they were wrong even while
   * the session was alive. The client wrote that dead id back into
   * `session.json`.
   */
  sessionId?: string
  /**
   * Whether a caller has been told the session id.
   *
   * `pendingSummary` sets it, because that is the one place the id leaves
   * the engine. Until then the session the watcher created is reachable from
   * nowhere else, so the handle still owns it and its expiry has to tear it
   * down — see `onExpire` in `requestEdgeLogin`. Afterwards the caller owns
   * it and the expiry must leave it alone, which is the documented
   * `--no-wait` flow: request the login, show the QR, let `poll-edge-login`
   * take the session over.
   */
  sessionHandedOver?: boolean
  sessionPromise?: Promise<SessionInfo>
  error?: string
  unwatchState?: () => void
}

interface EdgeSessionApi {
  create: (account: EdgeAccount, method: 'edge') => Promise<SessionInfo>
  peek: (sessionId: string) => SessionInfo | null
  forceLogout: (
    sessionId: string,
    reason: 'expired' | 'shutdown' | 'cancelled'
  ) => Promise<void>
}

function ensureEdgeSession(
  record: PendingRecord,
  sessions: EdgeSessionApi
): Promise<SessionInfo> | undefined {
  if (record.cancelled === true) return undefined
  if (record.sessionId != null) {
    const live = sessions.peek(record.sessionId)
    if (live != null) return Promise.resolve(live)
  }
  if (record.sessionPromise != null) return record.sessionPromise
  // A prior create failure is sticky until the pending login is cancelled or
  // expires — retrying on every GET can wedge the account into a loop.
  if (record.error != null) return undefined
  if (record.pending.account == null) return undefined

  record.sessionPromise = sessions
    .create(record.pending.account, 'edge')
    .then(async session => {
      if (record.cancelled === true) {
        try {
          await sessions.forceLogout(session.sessionId, 'cancelled')
        } catch {
          // best effort
        }
        throw engineError(
          'PENDING_LOGIN_NOT_FOUND',
          `Pending edge login cancelled: ${record.pendingId}`,
          404
        )
      }
      record.sessionId = session.sessionId
      return session
    })
    .catch((error: unknown) => {
      record.error = errorMessage(error)
      record.sessionPromise = undefined
      throw error
    })
  return record.sessionPromise
}

/** Options every login and create call accepts, from `EdgeAccountOptions`. */
const loginOptionFields = {
  otp: asOptional(doc(asString, 'A current 2FA code.')),
  otpKey: asOptional(
    doc(asString, 'The 2FA secret itself, instead of a code.')
  ),
  challengeId: asOptional(
    doc(asString, 'Supply after solving a CAPTCHA to retry the same request.')
  )
}

/**
 * The type, derived from the fields rather than restated beside them.
 *
 * A hand-written `interface LoginOptions` named the same three fields and
 * `accountOptions` forwarded them one `if` at a time, so a fourth field
 * added to `loginOptionFields` would be published on every login route's
 * body and documented in `docs/api` while this silently dropped it.
 */
const asLoginOptions = asObject(loginOptionFields)
type LoginOptions = ReturnType<typeof asLoginOptions>

/**
 * The option fields the caller named, with the absent ones left out.
 *
 * Through the cleaner, which keeps exactly the declared fields and drops the
 * rest of the route's body — so a new field is forwarded by being declared.
 */
function accountOptions(body: LoginOptions): EdgeAccountOptions {
  return withoutUndefined(asLoginOptions(body))
}

function pendingSummary(
  record: PendingRecord,
  sessions: EdgeSessionApi,
  expiresAt?: string
): PendingEdgeLogin {
  const { pending } = record
  // Reporting the session *is* handing it over: from here the caller can
  // name it, so the handle stops being its only owner.
  if (record.sessionId != null) record.sessionHandedOver = true
  return {
    objectId: record.pendingId,
    pendingId: record.pendingId,
    kind: 'pendingLogin',
    expiresAt: expiresAt ?? null,
    lobbyId: pending.id,
    uri: 'edge://edge/' + pending.id,
    state: pending.state,
    username: pending.username ?? null,
    // Re-derived on every call, so the session reported cannot outlive the
    // session it describes.
    session: record.sessionId != null ? sessions.peek(record.sessionId) : null,
    error: record.error ?? null
  }
}

/**
 * The pending login a `pending_` handle holds.
 *
 * Looked up through `ObjectHandleStore`, which owns it. A module-level
 * `Map` beside the store was a second copy of the same state, kept
 * consistent only because `onExpire` happened to be its one removal path —
 * and `poll-edge-login` already had to patch around that by deleting from
 * the map itself when the store reported `OBJECT_EXPIRED`.
 */
function getPending(ctx: RouteContext, pendingId: string): PendingRecord {
  let record: PendingRecord | undefined
  try {
    record = ctx.state.objects.get<PendingRecord>(
      pendingId,
      'pendingLogin'
    ).value
  } catch {
    record = undefined
  }
  if (record == null) {
    throw engineError(
      'PENDING_LOGIN_NOT_FOUND',
      `No pending edge login: ${pendingId}`,
      404
    )
  }
  return record
}

/**
 * Log in with a password.
 *
 * @note With `--solve-captcha` the client solves a `CHALLENGE_REQUIRED`
 *   response headlessly (ALTCHA proof-of-work) and retries once.
 */
export const loginWithPassword = route({
  core: 'context.loginWithPassword',
  method: 'POST',
  path: '/login-with-password',
  cli: { command: 'login-with-password', custom: true },
  body: asObject({
    username: doc(asString, 'The account name.'),
    password: doc(asString, 'The account password.'),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "password"`.'),
  errors: [
    'PASSWORD_ERROR',
    'USERNAME_ERROR',
    'OTP_REQUIRED',
    'CHALLENGE_REQUIRED',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    return await ctx.state.sessions.create(
      await ctx.state.core.context.loginWithPassword(
        ctx.body.username,
        ctx.body.password,
        accountOptions(ctx.body)
      ),
      'password'
    )
  }
})

/**
 * Log in with a device PIN.
 *
 * Only works on a device that has already saved a PIN for the account.
 */
export const loginWithPin = route({
  core: 'context.loginWithPIN',
  method: 'POST',
  path: '/login-with-pin',
  cli: {
    command: 'login-with-pin',
    custom: true
  },
  body: asObject({
    usernameOrLoginId: doc(asString, 'A username, or a login id.'),
    pin: doc(asString, 'The device PIN.'),
    useLoginId: asOptional(doc(asBoolean, 'Treat the value as a login id.')),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "pin"`.'),
  errors: [
    'PASSWORD_ERROR',
    'PIN_DISABLED',
    'USERNAME_ERROR',
    'USER_NOT_FOUND',
    'BAD_REQUEST',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    assertLoginId(ctx.body.usernameOrLoginId, ctx.body.useLoginId)
    let account: EdgeAccount
    try {
      account = await ctx.state.core.context.loginWithPIN(
        ctx.body.usernameOrLoginId,
        ctx.body.pin,
        { ...accountOptions(ctx.body), useLoginId: ctx.body.useLoginId }
      )
    } catch (error: unknown) {
      mapLoginIdFailure(error, ctx.body.useLoginId)
    }
    return await ctx.state.sessions.create(account, 'pin')
  }
})

/**
 * A `usernameOrLoginId` the caller said is a login id, checked here.
 *
 * `useLoginId` sends the value to core as base58 bytes, and core's parse
 * throws a plain `Error('Non-base58 character')` — which the engine maps to
 * `500 INTERNAL_ERROR`, on routes that declare `BAD_REQUEST`, with a message
 * that never names the flag that caused it. `login-with-key
 * --username-or-login-id=clitester --use-login-id` is the ordinary way to
 * hit it: a username passed under the flag that says it is not one.
 *
 * A well-formed id that no stash matches is core's `Cannot find stash
 * '<base64>'`, which is a 404 rather than an engine fault and should not put
 * an internal stash id in front of the user either. `mapLoginIdFailure`
 * below is that half.
 */
function assertLoginId(value: string, useLoginId: boolean | undefined): void {
  if (useLoginId !== true) return
  try {
    base58.parse(value)
  } catch {
    throw engineError(
      'BAD_REQUEST',
      'usernameOrLoginId must be base58 when useLoginId is set ' +
        '(--use-login-id on the command line). A username goes without the ' +
        'flag; `local-users` lists the login ids.',
      400
    )
  }
}

/**
 * Core's "no such stash" as the 404 it is.
 *
 * `Cannot find stash '<base64 id>'` arrived as `500 INTERNAL_ERROR` with the
 * internal id in the message, where every other "no such account" in this
 * API is `USER_NOT_FOUND`. The id is not secret — it is a public account
 * identifier — but it is in the wrong alphabet and means nothing to the
 * caller, so the message says what happened instead.
 */
function mapLoginIdFailure(
  error: unknown,
  useLoginId: boolean | undefined
): never {
  if (
    useLoginId === true &&
    errorMessage(error).includes('Cannot find stash')
  ) {
    throw engineError(
      'USER_NOT_FOUND',
      'No local account matches that login id. `local-users` lists the ' +
        'accounts this device has stashes for.',
      404
    )
  }
  throw error
}

/**
 * Log in with an account login key.
 *
 * The key comes from `get-login-key` on an already-authenticated session.
 */
export const loginWithKey = route({
  core: 'context.loginWithKey',
  method: 'POST',
  path: '/login-with-key',
  cli: {
    command: 'login-with-key',
    custom: true
  },
  body: asObject({
    usernameOrLoginId: doc(asString, 'A username, or a login id.'),
    loginKey: doc(asString, 'From `get-login-key`.'),
    useLoginId: asOptional(doc(asBoolean, 'Treat the value as a login id.')),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "key"`.'),
  errors: [
    'BAD_REQUEST',
    'PASSWORD_ERROR',
    'USERNAME_ERROR',
    'USER_NOT_FOUND',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    assertLoginId(ctx.body.usernameOrLoginId, ctx.body.useLoginId)
    let account: EdgeAccount
    try {
      account = await ctx.state.core.context.loginWithKey(
        ctx.body.usernameOrLoginId,
        ctx.body.loginKey,
        { ...accountOptions(ctx.body), useLoginId: ctx.body.useLoginId }
      )
    } catch (error: unknown) {
      mapLoginIdFailure(error, ctx.body.useLoginId)
    }
    return await ctx.state.sessions.create(account, 'key')
  }
})

/**
 * Log in with recovery answers.
 *
 * Needs both the recovery key and the answers; neither works alone.
 *
 * @coreNote Our surface drops the `2` from core's recovery2 naming, and calls
 *   the key `recoveryKey` to match what `change-recovery` returns.
 */
export const loginWithRecovery = route({
  core: 'context.loginWithRecovery2',
  coreExtra: {
    recoveryKey: 'Core calls it recovery2Key. The `2` is dropped throughout.'
  },
  method: 'POST',
  path: '/login-with-recovery',
  cli: {
    command: 'login-with-recovery',
    custom: true,
    flags: { answer: { maps: 'answers', repeat: true } }
  },
  body: asObject({
    recoveryKey: doc(asString, 'From `change-recovery`.'),
    username: doc(asString, 'The account name.'),
    answers: doc(asArray(asString), 'In the same order as the questions.'),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "recovery"`.'),
  errors: ['PASSWORD_ERROR', 'USERNAME_ERROR', 'NETWORK_ERROR'],

  async handler(ctx) {
    return await ctx.state.sessions.create(
      await ctx.state.core.context.loginWithRecovery2(
        ctx.body.recoveryKey,
        ctx.body.username,
        ctx.body.answers,
        accountOptions(ctx.body)
      ),
      'recovery'
    )
  }
})

/**
 * Create an account.
 *
 * Every credential is optional over REST: omitting all three creates a light
 * account with no username.
 *
 * @note The command requires a password and a PIN; `--username` is optional,
 *   and omitting it claims no name. Creating a *light* account — no
 *   credentials at all — is REST-only, so the published command form marks
 *   the two the command insists on. The reference bracketed all three, the
 *   parameter table called them optional, and the command's own refusal
 *   printed two of them unbracketed: three descriptions of one program.
 */
export const createAccount = route({
  core: 'context.createAccount',
  method: 'POST',
  path: '/create-account',
  cli: {
    command: 'create-account',
    custom: true,
    // Optional over REST, required by the command. Without this the three
    // surfaces disagreed; see the note above.
    flags: {
      password: { cliRequired: true },
      pin: { cliRequired: true }
    }
  },
  body: asObject({
    username: asOptional(
      doc(
        asString,
        'The name to claim. Omitted over REST alongside `password` and `pin`, this creates a light account with no username; on the command line it is the only one of the three that may be left out.'
      )
    ),
    password: asOptional(
      doc(
        asString,
        'The account password. Optional over REST \u2014 omitting all three credentials creates a light account \u2014 and required by the `create-account` command, which refuses without it.'
      )
    ),
    pin: asOptional(
      doc(
        asString,
        'A device PIN to save. Optional over REST, required by the command, like `password`.'
      )
    ),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "create"`.'),
  errors: [
    'USERNAME_ERROR',
    'CHALLENGE_REQUIRED',
    'BAD_REQUEST',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    return await ctx.state.sessions.create(
      await ctx.state.core.context.createAccount({
        ...accountOptions(ctx.body),
        username: ctx.body.username,
        password: ctx.body.password,
        pin: ctx.body.pin
      }),
      'create'
    )
  }
})

/**
 * Start a QR login.
 *
 * Asks the login server for a lobby another logged-in Edge device can approve.
 * The returned `lobbyId` is what goes in the QR code.
 *
 * @note The pending login is an object handle with a 5 minute TTL. On expiry
 *   the engine cancels the request on the login server for you.
 */
export const requestEdgeLogin = route({
  core: 'context.requestEdgeLogin',
  method: 'POST',
  path: '/request-edge-login',
  cli: {
    command: 'request-edge-login',
    custom: true,
    extra: {
      noWait: {
        kind: 'boolean',
        doc: 'Print the lobby and exit instead of polling, so the QR can be displayed while `poll-edge-login` watches the same handle from another process.'
      }
    },
    notes:
      'Prints the pending login, then polls every 2s for up to 5 minutes. On `done` it stores the session. With `--no-wait` it returns immediately and `poll-edge-login` takes over.'
  },
  body: asObject({}).withRest,
  returns: asPendingEdgeLogin,
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    const pending = await ctx.state.core.context.requestEdgeLogin({})
    const record: PendingRecord = {
      pendingId: '',
      pending,
      createdAt: Date.now()
    }

    const handle = ctx.state.objects.create({
      kind: 'pendingLogin',
      prefix: 'pending_',
      value: record,
      onExpire: async value => {
        value.cancelled = true
        try {
          value.unwatchState?.()
        } catch {
          // best effort
        }
        // A session nobody was ever told about, torn down for the same
        // reason `cancel-request` tears one down: the watcher calls
        // `ensureEdgeSession` as soon as the phone approves, whether or not
        // anyone is polling, so the ordinary `--no-wait` sequence — approve
        // at t≈10s, nothing polls, the handle expires at t=300s — left an
        // `EdgeAccount` open under an id no process had learned.
        // `engine-sessions` truncates it, so `logout` could not name it, and
        // it is the first hold in `heldByClients`, so it also kept the
        // engine alive indefinitely. Once `pendingSummary` has reported the
        // id the caller owns it, and expiry must not log it out underneath
        // them.
        // Both halves run and both are reported: a failure to log the
        // session out must not stop the login request being cancelled, and
        // neither may be swallowed. `ObjectHandleStore.delete` logs what
        // this throws against the handle's id and kind.
        const problems: string[] = []
        if (value.sessionId != null && value.sessionHandedOver !== true) {
          const sessionId = value.sessionId
          // Cleared before the attempt, not after: the handle is going away,
          // and a failed logout must not leave it pointing at a session
          // another release would try again.
          value.sessionId = undefined
          try {
            await ctx.state.sessions.forceLogout(sessionId, 'cancelled')
          } catch (error: unknown) {
            const message = errorMessage(error)
            problems.push(`logging out the session it created: ${message}`)
          }
        }
        try {
          await value.pending.cancelRequest()
        } catch (error: unknown) {
          const message = errorMessage(error)
          problems.push(`cancelling the login request: ${message}`)
        }
        if (problems.length > 0) throw new Error(problems.join('; '))
      }
    })
    record.pendingId = handle.objectId

    record.unwatchState = pending.watch(
      'state',
      (state: EdgePendingEdgeLogin['state']) => {
        if (state === 'done' && pending.account != null) {
          const promise = ensureEdgeSession(record, ctx.state.sessions)
          if (promise != null) {
            promise.catch(() => {
              // error already stored on record
            })
          }
        } else if (state === 'error') {
          const { error } = pending
          record.error = errorMessage(error)
        }
      }
    )

    return pendingSummary(record, ctx.state.sessions, handle.expiresAt)
  }
})

/**
 * Poll a pending QR login.
 *
 * Once `state` reaches `done` the engine has already created the session, so
 * the response carries one ready to use.
 *
 * @note Session creation is attempted once. A failure is sticky, so later
 *   polls report the same `error` rather than retrying.
 * @note Polling does not extend the handle TTL; only the original 5 minute
 *   window applies.
 * @coreNote Engine state for an in-flight requestEdgeLogin; core exposes it as
 *   EdgePendingEdgeLogin properties.
 */
export const pollEdgeLogin = route({
  core: null,
  method: 'GET',
  path: '/pending-edge-login',
  cli: {
    command: 'poll-edge-login',
    positional: 'pendingId',
    // Hand-written: a poll that reaches `done` carries a session, and the
    // command has to store it the way the other login commands do.
    custom: true
  },
  returns: asPendingEdgeLogin,
  errors: ['PENDING_LOGIN_NOT_FOUND', 'OBJECT_EXPIRED', 'OBJECT_KIND_MISMATCH'],

  async handler(ctx) {
    let expiresAt: string | undefined
    try {
      const handle = ctx.state.objects.get<PendingRecord>(
        ctx.params.pendingId,
        'pendingLogin'
      )
      expiresAt = ctx.state.objects.toInfo(handle).expiresAt
    } catch (error: unknown) {
      // `OBJECT_NOT_FOUND` becomes this route's own code, because an id this
      // engine does not hold is exactly what `PENDING_LOGIN_NOT_FOUND`
      // means and what `cancel-request` answers for the same state — two
      // codes for one condition is what a script switching on `error.code`
      // cannot work with. Everything else that already carries a code says
      // what it means: discarding all but `OBJECT_EXPIRED` used to replace
      // `OBJECT_KIND_MISMATCH` with whatever `getPending` decided two lines
      // later.
      if (error instanceof EngineError) {
        if (error.code !== 'OBJECT_NOT_FOUND') throw error
        throw engineError(
          'PENDING_LOGIN_NOT_FOUND',
          `No pending login: ${ctx.params.pendingId}`,
          404
        )
      }
      // Anything that is not an `EngineError` is an engine-side fault, not a
      // missing pending login. Falling through handed it to `getPending`,
      // which answers `404 PENDING_LOGIN_NOT_FOUND` for every failure — so a
      // fault inside the handle store told a `--no-wait` QR flow, polling in
      // a loop, that its login did not exist, and the cause reached no log
      // because `server.ts` records a 4xx as a warning with no stack.
      throw error
    }
    const record = getPending(ctx, ctx.params.pendingId)
    if (
      record.pending.state === 'done' &&
      record.sessionId == null &&
      record.error == null &&
      record.pending.account != null
    ) {
      try {
        await ensureEdgeSession(record, ctx.state.sessions)
      } catch {
        // error already stored on record
      }
    }
    return pendingSummary(record, ctx.state.sessions, expiresAt)
  }
})

/**
 * Cancel a pending QR login.
 *
 * @note If the login already completed and a session exists, that session is
 *   force-logged-out too, so cancelling cannot leave an orphan visible in
 *   `engine-sessions`.
 */
export const cancelEdgeLogin = route({
  core: 'EdgePendingEdgeLogin.cancelRequest',
  method: 'POST',
  path: '/pending-edge-login/cancel-request',
  cli: { command: 'cancel-request', positional: 'pendingId' },
  errors: ['PENDING_LOGIN_NOT_FOUND'],

  async handler(ctx) {
    const record = getPending(ctx, ctx.params.pendingId)
    record.cancelled = true
    try {
      record.unwatchState?.()
    } catch {
      // best effort
    }
    // A completed edge login may already have created a session before the
    // caller cancelled. Tear it down so cancelling cannot leave a logged-in
    // orphan discoverable via GET /engine/sessions.
    if (record.sessionId != null) {
      try {
        await ctx.state.sessions.forceLogout(record.sessionId, 'cancelled')
      } catch {
        // best effort
      }
      record.sessionId = undefined
    }
    // `release`, not `delete`: the handle's teardown calls core's
    // `cancelRequest()`, which throws when the lobby has already gone — the
    // ordinary case for a login that completed before the caller cancelled
    // it. The handle is released either way and the failure is in the engine
    // log, so answering 500 would report a failure for a cancel that worked.
    await ctx.state.objects.release(ctx.params.pendingId)
    return undefined
  }
})

/**
 * List active sessions.
 *
 * @coreNote The session registry is an engine construct; core has no
 *   multi-account session concept.
 */
export const engineSessions = route({
  core: null,
  method: 'GET',
  path: '/engine/sessions',
  cli: 'engine-sessions',
  returns: doc(
    asArray(asSessionListing),
    'A bare array, not wrapped in a key. Each `sessionId` is truncated: ' +
      'this route needs no session, so a usable id here would be a ' +
      'credential anyone who can reach the engine could collect.'
  ),

  handler(ctx) {
    return ctx.state.sessions.list()
  }
})
