import type {
  EdgeAccount,
  EdgeAccountOptions,
  EdgePendingEdgeLogin
} from 'edge-core-js'

import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import type { SessionInfo } from '../sessions'
import {
  optionalBoolean,
  optionalString,
  requireString,
  requireStringArray
} from './helpers'

interface PendingRecord {
  pendingId: string
  pending: EdgePendingEdgeLogin
  createdAt: number
  cancelled?: boolean
  session?: SessionInfo
  sessionPromise?: Promise<SessionInfo>
  error?: string
  unwatchState?: () => void
}

/** Secondary index so pendingId lookups stay O(1) alongside ObjectHandleStore. */
const pendingById = new Map<string, PendingRecord>()

interface EdgeSessionApi {
  create: (account: EdgeAccount, method: 'edge') => Promise<SessionInfo>
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
  if (record.session != null) return Promise.resolve(record.session)
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
      record.session = session
      return session
    })
    .catch((error: unknown) => {
      record.error = error instanceof Error ? error.message : String(error)
      record.sessionPromise = undefined
      throw error
    })
  return record.sessionPromise
}

function accountOptionsFromBody(
  body: Record<string, unknown>
): EdgeAccountOptions {
  const opts: EdgeAccountOptions = {}
  const challengeId = optionalString(body, 'challengeId')
  if (challengeId != null) opts.challengeId = challengeId
  const otp = optionalString(body, 'otp')
  if (otp != null) opts.otp = otp
  const otpKey = optionalString(body, 'otpKey')
  if (otpKey != null) opts.otpKey = otpKey
  return opts
}

function pendingSummary(
  record: PendingRecord,
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
    session: record.session ?? null,
    error: record.error ?? null
  }
}

function getPending(pendingId: string): PendingRecord {
  const record = pendingById.get(pendingId)
  if (record == null) {
    throw engineError(
      'PENDING_LOGIN_NOT_FOUND',
      `No pending edge login: ${pendingId}`,
      404
    )
  }
  return record
}

export function registerLoginRoutes(router: Router): void {
  /** context.loginWithPassword(username, password, opts) */
  router.add('POST', '/login-with-password', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = requireString(body, 'username')
    const password = requireString(body, 'password')
    const account: EdgeAccount = await ctx.state.core.context.loginWithPassword(
      username,
      password,
      accountOptionsFromBody(body)
    )
    return await ctx.state.sessions.create(account, 'password')
  })

  /** context.loginWithPIN(usernameOrLoginId, pin, opts) */
  router.add('POST', '/login-with-pin', async ctx => {
    const body = requireBodyObject(ctx.body)
    const usernameOrLoginId = requireString(body, 'usernameOrLoginId')
    const useLoginId = optionalBoolean(body, 'useLoginId')
    const pin = requireString(body, 'pin')
    const account: EdgeAccount = await ctx.state.core.context.loginWithPIN(
      usernameOrLoginId,
      pin,
      { ...accountOptionsFromBody(body), useLoginId }
    )
    return await ctx.state.sessions.create(account, 'pin')
  })

  /** context.loginWithKey(usernameOrLoginId, loginKey, opts) */
  router.add('POST', '/login-with-key', async ctx => {
    const body = requireBodyObject(ctx.body)
    const usernameOrLoginId = requireString(body, 'usernameOrLoginId')
    const loginKey = requireString(body, 'loginKey')
    const useLoginId = optionalBoolean(body, 'useLoginId')
    const account: EdgeAccount = await ctx.state.core.context.loginWithKey(
      usernameOrLoginId,
      loginKey,
      { ...accountOptionsFromBody(body), useLoginId }
    )
    return await ctx.state.sessions.create(account, 'key')
  })

  /** context.loginWithRecovery2(recovery2Key, username, answers, opts) */
  router.add('POST', '/login-with-recovery2', async ctx => {
    const body = requireBodyObject(ctx.body)
    const recovery2Key = requireString(body, 'recovery2Key')
    const username = requireString(body, 'username')
    const answers = requireStringArray(body, 'answers')
    const account: EdgeAccount =
      await ctx.state.core.context.loginWithRecovery2(
        recovery2Key,
        username,
        answers,
        accountOptionsFromBody(body)
      )
    return await ctx.state.sessions.create(account, 'recovery2')
  })

  /** context.createAccount(opts) */
  router.add('POST', '/create-account', async ctx => {
    const body = requireBodyObject(ctx.body)
    const username = optionalString(body, 'username')
    const password = optionalString(body, 'password')
    const pin = optionalString(body, 'pin')
    const account: EdgeAccount = await ctx.state.core.context.createAccount({
      ...accountOptionsFromBody(body),
      username,
      password,
      pin
    })
    return await ctx.state.sessions.create(account, 'create')
  })

  /** context.requestEdgeLogin(opts) */
  router.add('POST', '/request-edge-login', async ctx => {
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
        pendingById.delete(value.pendingId)
        try {
          await value.pending.cancelRequest()
        } catch {
          // best effort
        }
      }
    })
    record.pendingId = handle.objectId
    pendingById.set(handle.objectId, record)

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

    return pendingSummary(record, handle.expiresAt)
  })

  /** Engine state for an in-flight requestEdgeLogin. */
  router.add('GET', '/pending-edge-login/{pendingId}', async ctx => {
    let expiresAt: string | undefined
    try {
      const handle = ctx.state.objects.get<PendingRecord>(
        ctx.params.pendingId,
        'pendingLogin'
      )
      expiresAt = ctx.state.objects.toInfo(handle).expiresAt
    } catch (error: unknown) {
      // Fall through to map; may surface PENDING_LOGIN_NOT_FOUND below.
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'OBJECT_EXPIRED'
      ) {
        pendingById.delete(ctx.params.pendingId)
        throw error
      }
    }
    const record = getPending(ctx.params.pendingId)
    if (
      record.pending.state === 'done' &&
      record.session == null &&
      record.error == null &&
      record.pending.account != null
    ) {
      try {
        await ensureEdgeSession(record, ctx.state.sessions)
      } catch {
        // error already stored on record
      }
    }
    return pendingSummary(record, expiresAt)
  })

  /** EdgePendingEdgeLogin.cancelRequest() */
  router.add(
    'POST',
    '/pending-edge-login/{pendingId}/cancel-request',
    async ctx => {
      const record = getPending(ctx.params.pendingId)
      record.cancelled = true
      try {
        record.unwatchState?.()
      } catch {
        // best effort
      }
      // A completed edge login may already have created a session before the
      // caller cancelled. Tear it down so cancelling cannot leave a logged-in
      // orphan discoverable via GET /engine/sessions.
      if (record.session != null) {
        try {
          await ctx.state.sessions.forceLogout(
            record.session.sessionId,
            'cancelled'
          )
        } catch {
          // best effort
        }
        record.session = undefined
      }
      await ctx.state.objects.delete(ctx.params.pendingId)
      pendingById.delete(ctx.params.pendingId)
      return undefined
    }
  )

  /** Engine session registry; no core equivalent. */
  router.add('GET', '/engine/sessions', ctx => {
    return ctx.state.sessions.list()
  })
}
