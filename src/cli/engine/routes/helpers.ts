/**
 * Shared helpers for route handlers: session/account lookup, body field
 * validation, and query-string parsing. Not part of the core engine
 * infrastructure — just utilities reused across route modules.
 */
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { engineError } from '../errors'
import type { RouteContext } from '../router'
import type { SessionRecord } from '../sessions'

export function getSession(ctx: RouteContext): SessionRecord {
  const session = ctx.state.sessions.get(ctx.params.sessionId)
  ctx.state.sessions.touch(ctx.params.sessionId)
  return session
}

export function getAccount(ctx: RouteContext): EdgeAccount {
  return getSession(ctx).account
}

export function requireString(
  body: Record<string, unknown>,
  key: string
): string {
  const value = body[key]
  if (typeof value !== 'string' || value === '') {
    throw engineError('BAD_REQUEST', `Missing required field "${key}"`, 400)
  }
  return value
}

export function optionalString(
  body: Record<string, unknown>,
  key: string
): string | undefined {
  const value = body[key]
  if (value == null) return undefined
  if (typeof value !== 'string') {
    throw engineError('BAD_REQUEST', `Field "${key}" must be a string`, 400)
  }
  return value
}

export function requireStringArray(
  body: Record<string, unknown>,
  key: string
): string[] {
  const value = body[key]
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw engineError(
      'BAD_REQUEST',
      `Field "${key}" must be an array of strings`,
      400
    )
  }
  return value as string[]
}

export function optionalStringArray(
  body: Record<string, unknown>,
  key: string
): string[] | undefined {
  const value = body[key]
  if (value == null) return undefined
  return requireStringArray(body, key)
}

export function optionalBoolean(
  body: Record<string, unknown>,
  key: string
): boolean | undefined {
  const value = body[key]
  if (value == null) return undefined
  if (typeof value !== 'boolean') {
    throw engineError('BAD_REQUEST', `Field "${key}" must be a boolean`, 400)
  }
  return value
}

export function requireBoolean(
  body: Record<string, unknown>,
  key: string
): boolean {
  const value = body[key]
  if (typeof value !== 'boolean') {
    throw engineError('BAD_REQUEST', `Missing required field "${key}"`, 400)
  }
  return value
}

export function optionalNumber(
  body: Record<string, unknown>,
  key: string
): number | undefined {
  const value = body[key]
  if (value == null) return undefined
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw engineError('BAD_REQUEST', `Field "${key}" must be a number`, 400)
  }
  return value
}

export function requireQueryString(
  query: URLSearchParams,
  key: string
): string {
  const value = query.get(key)
  if (value == null || value === '') {
    throw engineError(
      'BAD_REQUEST',
      `Missing required query parameter "${key}"`,
      400
    )
  }
  return value
}

export function optionalQueryString(
  query: URLSearchParams,
  key: string
): string | undefined {
  return query.get(key) ?? undefined
}

export function optionalQueryDate(
  query: URLSearchParams,
  key: string
): Date | undefined {
  const raw = query.get(key)
  if (raw == null || raw === '') return undefined
  const ms = Number(raw)
  const date =
    Number.isFinite(ms) && raw.trim() !== '' ? new Date(ms) : new Date(raw)
  if (Number.isNaN(date.getTime())) {
    throw engineError(
      'BAD_REQUEST',
      `Query parameter "${key}" must be a valid date`,
      400
    )
  }
  return date
}

export function optionalQueryInt(
  query: URLSearchParams,
  key: string
): number | undefined {
  const raw = query.get(key)
  if (raw == null || raw === '') return undefined
  const value = Number.parseInt(raw, 10)
  if (Number.isNaN(value)) {
    throw engineError(
      'BAD_REQUEST',
      `Query parameter "${key}" must be an integer`,
      400
    )
  }
  return value
}

export function optionalQueryBoolean(
  query: URLSearchParams,
  key: string
): boolean | undefined {
  const raw = query.get(key)
  if (raw == null || raw === '') return undefined
  return raw === 'true' || raw === '1'
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
