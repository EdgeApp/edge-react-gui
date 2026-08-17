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
  asCtxSpendErrorBody,
  asCtxSpendGiftCard,
  asCtxSpendGiftCardsResponse,
  asCtxSpendMerchantsResponse,
  type CtxSpendAuthContext,
  type CtxSpendCreateGiftCardRequest,
  type CtxSpendGiftCard,
  type CtxSpendGiftCardsResponse,
  type CtxSpendMerchantsResponse
} from './ctxSpendTypes'

/**
 * Client for the CTX spend-api, authenticated by the anonymous keypair session
 * in `ctxSpendAuth.ts`.
 *
 * Scope is the surface confirmed against staging: `/me`, `/merchants`, and the
 * `/gift-cards` create, read, and list calls. Redemption is not wired up.
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

  /**
   * Order a gift card. This allocates a payment address and quotes the crypto
   * amount, but does not pay: the card stays `unpaid` until that address is
   * funded, and is fulfilled once the payment confirms.
   */
  createGiftCard: (
    request: CtxSpendCreateGiftCardRequest
  ) => Promise<CtxSpendGiftCard>

  /** Re-read one card, which is how payment and fulfilment are polled. */
  getGiftCard: (giftCardId: string) => Promise<CtxSpendGiftCard>
}

/**
 * Turn an error body into something worth reading.
 *
 * A rejected order answers with a per-field map, e.g.
 * `{"error":"bad request","fields":{"fiatAmount":["invalid"]}}`, and the
 * `fields` half is the part that says what to change.
 */
const describeError = (text: string): string => {
  const parsed = asMaybe(asJSON(asCtxSpendErrorBody))(text)
  if (parsed == null) return text
  const fields = Object.entries(parsed.fields ?? {})
    .map(([field, reasons]) => `${field}: ${reasons.join(', ')}`)
    .join('; ')
  return fields === '' ? parsed.error : `${parsed.error} (${fields})`
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

  const fetchAuthed = async (
    url: string,
    options: { method?: 'GET' | 'POST'; body?: unknown } = {}
  ): Promise<string> => {
    const method = options.method ?? 'GET'
    const body = options.body == null ? undefined : JSON.stringify(options.body)

    const send = async (): Promise<Response> => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Client-Id': config.clientId,
        Authorization: `Bearer ${await session.getAccessToken()}`
      }
      debugLog('ctxSpend', `${method} ${url}`, maskHeaders(headers), body ?? '')
      return await fetch(url, { method, headers, body })
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
      throw new Error(
        `CTX request failed (${response.status}): ${describeError(text)}`
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
      ),

    createGiftCard: async request =>
      asJSON(asCtxSpendGiftCard)(
        await fetchAuthed(buildUrl('/gift-cards'), {
          method: 'POST',
          body: request
        })
      ),

    getGiftCard: async giftCardId =>
      asJSON(asCtxSpendGiftCard)(
        await fetchAuthed(buildUrl(`/gift-cards/${giftCardId}`))
      )
  }
}
