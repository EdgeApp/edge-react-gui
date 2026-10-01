/**
 * Shared helpers for route handlers: session/account lookup, body field
 * validation, and query-string parsing. Not part of the core engine
 * infrastructure — just utilities reused across route modules.
 */
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { engineError } from '../errors'
import type { HandleRecord, ObjectHandleKind } from '../objectHandles'
import type { RouteContext } from '../router'
import type { SessionRecord } from '../sessions'

/**
 * The session a route is acting on, with its activity clock refreshed.
 *
 * One lookup. Calling `sessions.touch` after `sessions.get` repeated the Map
 * lookup and the expiry test, and built a `SessionInfo` — eight fields and
 * three `Date#toISOString` calls — that nobody read, on every session-scoped
 * request.
 */
export function getSession(ctx: RouteContext): SessionRecord {
  const session = ctx.state.sessions.get(ctx.params.sessionId)
  session.lastActivityAt = Date.now()
  return session
}

export function getAccount(ctx: RouteContext): EdgeAccount {
  return getSession(ctx).account
}

/**
 * The object handle an `/account/{sessionId}/…` path names, once the session
 * itself has been resolved.
 *
 * Resolving the session is the authorisation step, and it has to come first:
 * `SessionStore.get` is the only thing that rejects a logged-out or expired
 * session id, so comparing the handle's own recorded `sessionId` proves only
 * that two strings match. A handle stored without a `sessionId` — every
 * pending login is — skips that comparison entirely, which would leave these
 * paths answering for a session id that was never issued.
 */
export function requireOwnedHandle<T>(
  ctx: RouteContext,
  objectId: string,
  kind?: ObjectHandleKind
): HandleRecord<T> {
  getSession(ctx)
  const record = ctx.state.objects.get<T>(objectId, kind)
  // An owner-less handle is refused here too, not just a mismatched one.
  // Skipping the comparison when `sessionId` was null made every
  // session-less handle reachable from *any* session: with two accounts
  // logged into one engine, A could read B's pending edge login out of
  // `object-get` and cancel it through `object-delete`. A handle that
  // belongs to no session belongs on the un-scoped paths it already has.
  if (record.sessionId !== ctx.params.sessionId) {
    throw engineError(
      'OBJECT_SESSION_MISMATCH',
      record.sessionId == null
        ? `objectId ${objectId} belongs to no session; use the un-scoped path for it`
        : `objectId ${objectId} belongs to a different session`,
      400
    )
  }
  return record
}

/** The wallet fields every listing and creation route returns. */
export function summarizeWallet(
  wallet: EdgeCurrencyWallet
): Record<string, unknown> {
  return {
    walletId: wallet.id,
    id: wallet.id,
    type: wallet.type,
    name: wallet.name,
    pluginId: wallet.currencyInfo.pluginId,
    currencyCode: wallet.currencyInfo.currencyCode,
    fiatCurrencyCode: wallet.fiatCurrencyCode,
    blockHeight: wallet.blockHeight,
    syncStatus: wallet.syncStatus,
    syncRatio:
      wallet.syncStatus?.totalRatio != null
        ? `${Math.round(wallet.syncStatus.totalRatio * 100)}%`
        : undefined,
    paused: wallet.paused,
    imported: wallet.imported,
    created: wallet.created?.toISOString() ?? null,
    enabledTokenIds: wallet.enabledTokenIds,
    detectedTokenIds: wallet.detectedTokenIds,
    unactivatedTokenIds: wallet.unactivatedTokenIds
  }
}
