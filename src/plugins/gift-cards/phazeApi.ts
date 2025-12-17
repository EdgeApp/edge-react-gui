import { asMaybe } from 'cleaners'

import {
  asPhazeCreateOrderResponse,
  asPhazeError,
  asPhazeGiftCardsResponse,
  asPhazeOrderStatusResponse,
  asPhazeRegisterUserResponse,
  asPhazeTokensResponse,
  type PhazeCreateOrderRequest,
  type PhazeOrderStatusResponse,
  type PhazeRegisterUserRequest
} from './phazeGiftCardTypes'

// ---------------------------------------------------------------------------
// Field definitions for different use cases
// ---------------------------------------------------------------------------

/**
 * Fields needed for market listing display (minimal payload).
 * These are the fields shown in GiftCardMarketScene tiles/list items.
 */
export const MARKET_LISTING_FIELDS = [
  'brandName',
  'countryName',
  'currency',
  'denominations',
  'valueRestrictions',
  'productId',
  'productImage',
  'categories'
].join(',')

/**
 * Additional fields needed for the purchase scene.
 * Used when fetching full brand details.
 */
export const PURCHASE_DETAIL_FIELDS = [
  'productDescription',
  'termsAndConditions',
  'howToUse',
  'expiryAndValidity',
  'discount',
  'deliveryFeeInPercentage',
  'deliveryFlatFee',
  'deliveryFlatFeeCurrency'
]

/**
 * All fields needed for a complete brand object.
 */
export const FULL_BRAND_FIELDS = [
  ...MARKET_LISTING_FIELDS.split(','),
  ...PURCHASE_DETAIL_FIELDS
].join(',')

export interface PhazeApiConfig {
  baseUrl: string
  apiKey: string
  /** Optional on first run; required for order endpoints once registered */
  userApiKey?: string
  /** Optional: Some endpoints may allow/require a public-key header */
  publicKey?: string
}

export interface PhazeApi {
  // Configuration helpers:
  setUserApiKey: (userApiKey: string | undefined) => void

  // Endpoints:
  getTokens: () => Promise<ReturnType<typeof asPhazeTokensResponse>>
  getGiftCards: (params: {
    countryCode: string
    currentPage?: number
    perPage?: number
    brandName?: string
  }) => Promise<ReturnType<typeof asPhazeGiftCardsResponse>>
  getFullGiftCards: (params: {
    countryCode: string
    /** Comma-separated list of fields to return (reduces payload size) */
    fields?: string
    /** Filter expression (e.g., "categories=pets") */
    filter?: string
  }) => Promise<ReturnType<typeof asPhazeGiftCardsResponse>>
  getUserByEmail: (
    email: string
  ) => Promise<ReturnType<typeof asPhazeRegisterUserResponse>>
  registerUser: (
    body: PhazeRegisterUserRequest
  ) => Promise<ReturnType<typeof asPhazeRegisterUserResponse>>
  createOrder: (
    body: PhazeCreateOrderRequest
  ) => Promise<ReturnType<typeof asPhazeCreateOrderResponse>>
  getOrderStatus: (params: {
    quoteId?: string
    currentPage?: number
  }) => Promise<PhazeOrderStatusResponse>
}

export const makePhazeApi = (config: PhazeApiConfig): PhazeApi => {
  let userApiKey = config.userApiKey

  const makeHeaders = (opts?: {
    includeUserKey?: boolean
    includePublicKey?: boolean
  }): Record<string, string> => {
    const headers: Record<string, string> = {
      'API-Key': config.apiKey
    }
    if (opts?.includeUserKey === true && userApiKey != null) {
      headers['user-api-key'] = userApiKey
    }
    if (opts?.includePublicKey === true && config.publicKey != null) {
      headers['public-key'] = config.publicKey
    }
    return headers
  }

  const buildUrl = (path: string, query?: Record<string, any>): string => {
    // Ensure baseUrl ends with / and path doesn't start with /
    // to properly join paths (new URL ignores base path if path is absolute)
    const base = config.baseUrl.endsWith('/')
      ? config.baseUrl
      : config.baseUrl + '/'
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const url = new URL(cleanPath, base)
    if (query != null) {
      for (const [k, v] of Object.entries(query)) {
        if (v == null) continue
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  const fetchPhaze: typeof fetch = async (input, init) => {
    // Input should already be a full URL from buildUrl, just pass through
    const url = typeof input === 'string' ? input : input.toString()

    // Debug logging - always log for now to help debug auth issues
    const headersStr =
      init?.headers != null
        ? Object.entries(init.headers as Record<string, string>)
            .map(([key, value]) => ` -H '${key}: ${value}'`)
            .join('')
        : ''
    console.log(
      `[Phaze] curl -X ${init?.method ?? 'GET'}${headersStr} '${url}'${
        init?.body != null ? ` -d '${init.body}'` : ''
      }`
    )

    const response = await fetch(url, init)
    if (!response.ok) {
      const text = await response.text()
      const errorObj = asMaybe(asPhazeError)(safeJson(text)) ?? undefined
      if (errorObj != null) {
        throw new Error(
          errorObj.httpStatusCode != null
            ? `${errorObj.httpStatusCode} ${errorObj.error}`
            : errorObj.error
        )
      }
      throw new Error(`HTTP error! status: ${response.status} body: ${text}`)
    }
    return response
  }

  const safeJson = (text: string): any => {
    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }

  return {
    setUserApiKey: (key?: string) => {
      userApiKey = key
    },

    // GET /crypto/tokens
    getTokens: async () => {
      const response = await fetchPhaze(buildUrl('/crypto/tokens'), {
        headers: makeHeaders()
      })
      const text = await response.text()
      return asPhazeTokensResponse(safeJson(text))
    },

    // GET /gift-cards/:country
    getGiftCards: async params => {
      const { countryCode, currentPage = 1, perPage = 50, brandName } = params
      const response = await fetchPhaze(
        buildUrl(`/gift-cards/${countryCode}`, {
          currentPage,
          perPage,
          brandName
        }),
        {
          headers: makeHeaders({ includePublicKey: true })
        }
      )
      const text = await response.text()
      return asPhazeGiftCardsResponse(safeJson(text))
    },

    // GET /gift-cards/full/:country - Returns all brands without pagination
    getFullGiftCards: async params => {
      const { countryCode, fields, filter } = params
      const response = await fetchPhaze(
        buildUrl(`/gift-cards/full/${countryCode}`, { fields, filter }),
        {
          headers: makeHeaders({ includePublicKey: true })
        }
      )
      const text = await response.text()
      return asPhazeGiftCardsResponse(safeJson(text))
    },

    // GET /crypto/user?email=... - Lookup existing user by email
    getUserByEmail: async email => {
      const response = await fetchPhaze(buildUrl('/crypto/user', { email }), {
        headers: makeHeaders()
      })
      const text = await response.text()
      return asPhazeRegisterUserResponse(safeJson(text))
    },

    // POST /crypto/user
    registerUser: async body => {
      const response = await fetchPhaze(buildUrl('/crypto/user'), {
        method: 'POST',
        headers: { ...makeHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const text = await response.text()
      return asPhazeRegisterUserResponse(safeJson(text))
    },

    // POST /crypto/order
    createOrder: async body => {
      if (userApiKey == null) {
        throw new Error('userApiKey required for createOrder')
      }
      const response = await fetchPhaze(buildUrl('/crypto/order'), {
        method: 'POST',
        headers: {
          ...makeHeaders({ includeUserKey: true }),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      const text = await response.text()
      return asPhazeCreateOrderResponse(safeJson(text))
    },

    // GET /crypto/orders/status
    getOrderStatus: async params => {
      if (userApiKey == null) {
        throw new Error('userApiKey required for getOrderStatus')
      }
      const response = await fetchPhaze(
        buildUrl('/crypto/orders/status', {
          quoteId: params.quoteId,
          currentPage: params.currentPage
        }),
        { headers: makeHeaders({ includeUserKey: true }) }
      )
      const text = await response.text()
      return asPhazeOrderStatusResponse(safeJson(text))
    }
  }
}
