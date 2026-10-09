/**
 * Shared helpers for route handlers: session and account lookup, handle
 * ownership, and the shared wallet summary.
 *
 * Not validation. Both layers that lived here — body fields and the query
 * string — are gone: the `query` and `body` cleaners on each `route()` are
 * the only validation layer, and a docstring still advertising the old ones
 * reads as an invitation to put a validator back here.
 */
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import {
  readSyncedSettingsOrThrow,
  type SyncedSettingsSubset
} from '../../../util/syncedSettingsFile'
import { engineError, errorMessage, toErrorBody } from '../errors'
import type { HandleRecord, ObjectHandleKind } from '../objectHandles'
import type { RouteContext } from '../router'
import type { WalletSummary } from '../schemas'
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
 * The account's synced settings, for a route that must not substitute the
 * defaults — with a file that is there and unreadable reported as that.
 *
 * The strict read throws whatever failed, and for the commonest shape — a
 * truncated or half-synced `Settings.json` — that is `JSON.parse`'s
 * `SyntaxError`, which names neither the file nor the condition and reached
 * the caller as an undeclared `500 INTERNAL_ERROR`, exit 1. The account is
 * what is wrong, and a sync that has not finished may still fix it, so this
 * is a declared `503` a script can retry on.
 */
export async function readAccountSyncedSettings(
  account: EdgeAccount
): Promise<SyncedSettingsSubset> {
  try {
    return await readSyncedSettingsOrThrow(account)
  } catch (error: unknown) {
    throw engineError(
      'SETTINGS_UNREADABLE',
      `The account\u2019s synced Settings.json could not be read (${errorMessage(
        error
      )}), and this call needs its fiat and display units. It may be half-synced: try again once the account has synced.`,
      503
    )
  }
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
  // Ownership before anything `get` would say about the handle. An owner-less
  // handle is refused here too, not just a mismatched one: skipping the
  // comparison when `sessionId` was null made every session-less handle
  // reachable from *any* session: with two accounts logged into one engine, A
  // could read B's pending edge login out of `object-get` and cancel it
  // through `object-delete`. A handle that belongs to no session belongs on
  // the un-scoped paths it already has.
  const owner = ctx.state.objects.peekOwner(objectId)
  if (owner != null && owner.sessionId !== ctx.params.sessionId) {
    throw engineError(
      'OBJECT_SESSION_MISMATCH',
      owner.sessionId == null
        ? `objectId ${objectId} belongs to no session; use the un-scoped path for it`
        : `objectId ${objectId} belongs to a different session`,
      400
    )
  }
  // Only now the kind, expiry and in-use checks — and `OBJECT_NOT_FOUND`,
  // which `peekOwner` deliberately leaves to `get` so there is one place that
  // decides what a missing handle answers.
  return ctx.state.objects.get<T>(objectId, kind)
}

/** The wallet fields every listing and creation route returns. */
export function summarizeWallet(wallet: EdgeCurrencyWallet): WalletSummary {
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

/**
 * Core's `EdgeResult[]` as this API's per-entry envelope.
 *
 * `create-currency-wallets` and `split` publish the same shape and built it
 * with the same thirteen lines, character for character — so how a failed
 * entry reports (a code, a `details` field, the `instanceof Error` fallback)
 * was two edits with nothing comparing them. `wallets.ts` already documents
 * its `results` as "like batch create".
 */
export function summarizeWalletResults(
  results: Array<
    { ok: true; result: EdgeCurrencyWallet } | { ok: false; error: unknown }
  >
): { results: Array<Record<string, unknown>> } {
  return {
    results: results.map(result => {
      if (result.ok) return { ok: true, wallet: summarizeWallet(result.result) }
      // The same envelope every other failure in this engine carries, built
      // by the same function: a bare message dropped the code, the status
      // and the `details`, on the one failure class these routes tell a
      // caller to expect — "partial success is normal" — and under a 200,
      // so `EXIT_CODE_BY_ERROR` never sees it either. An
      // `InsufficientFundsError` creating an activated wallet, core's
      // `NetworkError` and a plugin fault all arrived as prose a script
      // could only match on.
      const { error } = toErrorBody(result.error).body
      return {
        ok: false,
        // `error` stays a string, because that is what the declaration
        // publishes and what a caller already reads; the machine-readable
        // half arrives beside it.
        error: error.message,
        code: error.code,
        status: error.status,
        ...(error.details == null ? {} : { details: error.details })
      }
    })
  }
}

/**
 * Which plugin claims each wallet type.
 *
 * Built once, because the question was answered by two near-identical scans
 * of `Object.keys(account.currencyConfig)` — a `.find` in `unloadedWallets`
 * and a `.some` in `split-wallet` — and each sat *inside* a loop, so the
 * whole plugin table was re-walked per wallet and per requested split. The
 * table is around twenty-five entries and this function's own docblock
 * measures fourteen unloaded wallets.
 *
 * Through `currencyConfig` rather than by stripping the `wallet:` prefix,
 * because a plugin's id and its wallet type are not always the same word.
 */
export function pluginIdsByWalletType(
  account: EdgeAccount
): Map<string, string> {
  const byType = new Map<string, string>()
  for (const pluginId of Object.keys(account.currencyConfig)) {
    byType.set(
      account.currencyConfig[pluginId].currencyInfo.walletType,
      pluginId
    )
  }
  return byType
}

/**
 * The active wallets core did not build an API for.
 *
 * `account.activeWalletIds` is every non-archived, non-deleted wallet, and
 * `account.currencyWallets[id]` is absent for one whose engine failed to
 * start — a plugin that is not in the build, one that will not initialise,
 * one whose keys this version cannot read. `currency-wallets` filtered those
 * out and said nothing, and `wait-for-all-wallets` answered with no body at
 * all, so on an account whose wallets include an asset the CLI cannot load,
 * every listing was short, every command naming one of them answered
 * `404 WALLET_NOT_FOUND`, and there was no diagnostic anywhere — not in the
 * response, not in `engine-<profile>.log`. Measured on a real account: 21
 * active wallets, 7 loaded, 14 silently absent, two of them on a plugin the
 * engine reports as enabled.
 *
 * `walletType` and `pluginId` come from `allKeys` and from `currencyConfig`,
 * which carry every wallet and every plugin whether or not either worked.
 *
 * What this *cannot* say is why core declined, and the first attempt claimed
 * it could: a `pluginLoaded` derived from `pluginId != null` was true for
 * every entry, because `currencyConfig` holds every plugin
 * `makeCoreContext` *registered* — and `edge-currency-accountbased`
 * registers monero, zano, zcash and piratechain whether or not the native
 * modules behind them exist, then fails when core builds the engine. On a
 * real account that published "should have worked and did not" for ten
 * wallets that cannot work in a Node CLI at all. So the fields say only
 * what is true: the plugin is *registered*, and whether any other wallet of
 * the same type did load — which is the distinction an operator can act on,
 * because a plugin with no loaded wallet anywhere is the common factor and
 * one with a loaded wallet beside the failures is not.
 */
export function unloadedWallets(account: EdgeAccount): Array<{
  walletId: string
  walletType: string
  pluginId: string | null
  pluginRegistered: boolean
  pluginHasLoadedWallet: boolean
}> {
  // Which wallet types did load, so a failure can be told from the plugin
  // being unusable here.
  const loadedTypes = new Set<string>()
  for (const walletId of account.activeWalletIds) {
    const wallet = account.currencyWallets[walletId]
    if (wallet != null) loadedTypes.add(wallet.currencyInfo.walletType)
  }
  // Hoisted like `loadedTypes` above it, and for the same reason: the lookup
  // below runs once per unloaded wallet.
  const pluginIds = pluginIdsByWalletType(account)
  const out = []
  for (const walletId of account.activeWalletIds) {
    if (account.currencyWallets[walletId] != null) continue
    const info = account.allKeys.find(key => key.id === walletId)
    const walletType = info?.type ?? ''
    const pluginId = pluginIds.get(walletType) ?? null
    out.push({
      walletId,
      walletType,
      pluginId,
      pluginRegistered: pluginId != null,
      pluginHasLoadedWallet: loadedTypes.has(walletType)
    })
  }
  return out
}
