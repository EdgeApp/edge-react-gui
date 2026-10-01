import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeAccount,
  EdgeAccountOptions,
  EdgePendingEdgeLogin
} from 'edge-core-js'

import { doc } from '../doc'
import { EngineError, engineError } from '../errors'
import { route } from '../route'
import type { RouteContext } from '../router'
import { asPendingEdgeLogin, asSession, asSessionListing } from '../schemas'
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
      record.error = error instanceof Error ? error.message : String(error)
      record.sessionPromise = undefined
      throw error
    })
  return record.sessionPromise
}

interface LoginOptions {
  otp?: string
  otpKey?: string
  challengeId?: string
}

function accountOptions(body: LoginOptions): EdgeAccountOptions {
  const opts: EdgeAccountOptions = {}
  if (body.challengeId != null) opts.challengeId = body.challengeId
  if (body.otp != null) opts.otp = body.otp
  if (body.otpKey != null) opts.otpKey = body.otpKey
  return opts
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

function pendingSummary(
  record: PendingRecord,
  sessions: EdgeSessionApi,
  expiresAt?: string
): Record<string, unknown> {
  const { pending } = record
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
    const account: EdgeAccount = await ctx.state.core.context.loginWithPassword(
      ctx.body.username,
      ctx.body.password,
      accountOptions(ctx.body)
    )
    return await ctx.state.sessions.create(account, 'password')
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
    'BAD_REQUEST',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const account: EdgeAccount = await ctx.state.core.context.loginWithPIN(
      ctx.body.usernameOrLoginId,
      ctx.body.pin,
      { ...accountOptions(ctx.body), useLoginId: ctx.body.useLoginId }
    )
    return await ctx.state.sessions.create(account, 'pin')
  }
})

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
  errors: ['PASSWORD_ERROR', 'USERNAME_ERROR', 'NETWORK_ERROR'],

  async handler(ctx) {
    const account: EdgeAccount = await ctx.state.core.context.loginWithKey(
      ctx.body.usernameOrLoginId,
      ctx.body.loginKey,
      { ...accountOptions(ctx.body), useLoginId: ctx.body.useLoginId }
    )
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
    const account: EdgeAccount =
      await ctx.state.core.context.loginWithRecovery2(
        ctx.body.recoveryKey,
        ctx.body.username,
        ctx.body.answers,
        accountOptions(ctx.body)
      )
    return await ctx.state.sessions.create(account, 'recovery')
  }
})

/**
 * Create an account.
 *
 * Every credential is optional over REST: omitting all three creates a light
 * account with no username.
 *
 * @note The command requires a username, password and PIN. Creating a light
 *   account is REST-only.
 */
export const createAccount = route({
  core: 'context.createAccount',
  method: 'POST',
  path: '/create-account',
  cli: {
    command: 'create-account',
    custom: true
  },
  body: asObject({
    username: asOptional(doc(asString, 'The name to claim.')),
    password: asOptional(doc(asString, 'The account password.')),
    pin: asOptional(doc(asString, 'A device PIN to save.')),
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
    const account: EdgeAccount = await ctx.state.core.context.createAccount({
      ...accountOptions(ctx.body),
      username: ctx.body.username,
      password: ctx.body.password,
      pin: ctx.body.pin
    })
    return await ctx.state.sessions.create(account, 'create')
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
        try {
          await value.pending.cancelRequest()
        } catch {
          // best effort
        }
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
          record.error = error instanceof Error ? error.message : String(error)
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
  errors: ['PENDING_LOGIN_NOT_FOUND', 'OBJECT_EXPIRED'],

  async handler(ctx) {
    let expiresAt: string | undefined
    try {
      const handle = ctx.state.objects.get<PendingRecord>(
        ctx.params.pendingId,
        'pendingLogin'
      )
      expiresAt = ctx.state.objects.toInfo(handle).expiresAt
    } catch (error: unknown) {
      // Rethrow anything that already carries a code: discarding every code
      // but `OBJECT_EXPIRED` replaced `OBJECT_KIND_MISMATCH` and
      // `OBJECT_NOT_FOUND` with whatever `getPending` decided two lines
      // later.
      if (error instanceof EngineError) throw error
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
    await ctx.state.objects.delete(ctx.params.pendingId)
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
