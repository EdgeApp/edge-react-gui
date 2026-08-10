import { asJSON, asMaybe } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import { debugLog, maskHeaders } from '../../util/logger'
import {
  type CtxSpendAuthConfig,
  type CtxSpendIdentityStatus,
  type CtxSpendSession,
  makeCtxSpendSession
} from './ctxSpendAuth'
import {
  asCtxSpendAuthContext,
  asCtxSpendError,
  asCtxSpendGiftCardsResponse,
  asCtxSpendMerchantsResponse,
  type CtxSpendAuthContext,
  type CtxSpendGiftCardsResponse,
  type CtxSpendMerchantsResponse
} from './ctxSpendTypes'

/**
 * Read client for the CTX spend-api, authenticated by the anonymous keypair
 * session in `ctxSpendAuth.ts`.
 *
 * Scope is deliberately the read surface confirmed against staging: `/me`,
 * `/merchants`, and `/gift-cards`. Purchase and redemption are not wired up.
 */

export type CtxSpendApiConfig = CtxSpendAuthConfig

export interface CtxSpendApi {
  /**
   * Establish the keypair identity. Must return `ready` before any request;
   * throws when the identity could not be loaded or created.
   */
  ensureIdentity: (account: EdgeAccount) => Promise<CtxSpendIdentityStatus>

  getPublicKeyHex: () => string | undefined

  /** The authenticated user, company, and granted permissions. */
  getMe: () => Promise<CtxSpendAuthContext>

  /** The purchasable brand catalog. */
  getMerchants: (params?: {
    country?: string
    page?: number
  }) => Promise<CtxSpendMerchantsResponse>

  /** Gift cards owned by the authenticated user. */
  getGiftCards: (params?: {
    page?: number
  }) => Promise<CtxSpendGiftCardsResponse>
}

export const makeCtxSpendApi = (config: CtxSpendApiConfig): CtxSpendApi => {
  const baseUrl = config.baseUrl.replace(/\/$/, '')
  const session: CtxSpendSession = makeCtxSpendSession(config)

  /**
   * Build a request URL by string, not via `URL`. React Native's `URL` appends
   * a trailing slash to any path that has no query string, and the spend-api
   * routes `/me/` and `/merchants/` to 404.
   */
  const buildUrl = (
    path: string,
    query?: Record<string, string | number | undefined>
  ): string => {
    const params =
      query == null
        ? []
        : Object.entries(query)
            .filter(([, value]) => value != null)
            .map(
              ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(
                  String(value)
                )}`
            )
    return params.length === 0
      ? `${baseUrl}${path}`
      : `${baseUrl}${path}?${params.join('&')}`
  }

  const fetchAuthed = async (url: string): Promise<string> => {
    const send = async (): Promise<Response> => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Client-Id': config.clientId,
        Authorization: `Bearer ${await session.getAccessToken()}`
      }
      debugLog('ctxSpend', `GET ${url}`, maskHeaders(headers))
      return await fetch(url, { method: 'GET', headers })
    }

    let response = await send()
    // A 401 on a token we believed was live means the server retired it early.
    // Drop it and re-authenticate once before surfacing the failure.
    if (response.status === 401) {
      debugLog('ctxSpend', 'Access token rejected, re-authenticating')
      session.invalidateTokens()
      response = await send()
    }

    const text = await response.text()
    if (!response.ok) {
      const parsed = asMaybe(asJSON(asCtxSpendError))(text)
      throw new Error(
        parsed != null
          ? `CTX request failed (${response.status}): ${parsed.error}`
          : `CTX request failed (${response.status})`
      )
    }
    return text
  }

  return {
    ensureIdentity: async account => await session.ensureIdentity(account),

    getPublicKeyHex: () => session.getPublicKeyHex(),

    getMe: async () =>
      asJSON(asCtxSpendAuthContext)(await fetchAuthed(buildUrl('/me'))),

    getMerchants: async (params = {}) =>
      asJSON(asCtxSpendMerchantsResponse)(
        await fetchAuthed(
          buildUrl('/merchants', {
            country: params.country,
            page: params.page
          })
        )
      ),

    getGiftCards: async (params = {}) =>
      asJSON(asCtxSpendGiftCardsResponse)(
        await fetchAuthed(buildUrl('/gift-cards', { page: params.page }))
      )
  }
}
