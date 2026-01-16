import { asJSON, asMaybe } from 'cleaners'

import { debugLog, maskHeaders } from '../../util/logger'
import {
  asPhazeCreateOrderResponse,
  asPhazeError,
  asPhazeFxRatesResponse,
  asPhazeGiftCardsResponse,
  asPhazeOrderStatusResponse,
  asPhazeRegisterUserResponse,
  asPhazeTokensResponse,
  type PhazeCreateOrderRequest,
  type PhazeFxRate,
  type PhazeGiftCardBrand,
  type PhazeOrderStatusResponse,
  type PhazeRegisterUserRequest
} from './phazeGiftCardTypes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum card value in USD. Cards below this are filtered out. */
export const MINIMUM_CARD_VALUE_USD = 5

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
  getUserApiKey: () => string | undefined

  // Endpoints:
  getTokens: () => Promise<ReturnType<typeof asPhazeTokensResponse>>
  /**
   * Ensures FX rates are fetched and cached.
   * Called during provider initialization to guarantee rates are available.
   */
  ensureFxRates: () => Promise<void>
  /**
   * Returns cached FX rates. Guaranteed to be available after
   * ensureFxRates() completes (called during provider init).
   */
  getCachedFxRates: () => PhazeFxRate[] | null
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
  let cachedFxRates: PhazeFxRate[] | null = null

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

  const buildUrl = (
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string => {
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
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : input.url

    // Debug logging - only logs when 'phaze' category is enabled, with masked headers
    const rawHeaders = (init?.headers as Record<string, string>) ?? {}
    const maskedHeaders = maskHeaders(rawHeaders)
    const headersStr = Object.entries(maskedHeaders)
      .map(([key, value]) => ` -H '${key}: ${String(value)}'`)
      .join('')
    const bodyStr =
      init?.body != null && typeof init.body === 'string'
        ? ` -d '${init.body}'`
        : ''
    debugLog(
      'phaze',
      `curl -X ${init?.method ?? 'GET'}${headersStr} '${url}'${bodyStr}`
    )

    const response = await fetch(url, init)
    if (!response.ok) {
      const text = await response.text()
      const errorObj = asMaybe(asJSON(asPhazeError))(text)
      if (errorObj != null) {
        throw new Error(
          errorObj.httpStatusCode != null
            ? `${errorObj.httpStatusCode} ${errorObj.error}`
            : errorObj.error
        )
      }
      throw new Error(`HTTP error! status: ${response.status} body: ${text}`)
    }
    debugLog('phaze', `Response: ${response.status} ${response.statusText}`)
    return response
  }

  /** Fetch FX rates, using cached value if available */
  const getOrFetchFxRates = async (): Promise<PhazeFxRate[]> => {
    if (cachedFxRates != null) return cachedFxRates
    const response = await fetchPhaze(buildUrl('/crypto/exchange-rates'), {
      headers: makeHeaders()
    })
    const text = await response.text()
    debugLog(
      'phaze',
      `getFxRates response: ${response.status} ${response.statusText}`
    )
    const parsed = asJSON(asPhazeFxRatesResponse)(text)
    cachedFxRates = parsed.rates
    return cachedFxRates
  }

  return {
    setUserApiKey: (key?: string) => {
      userApiKey = key
    },

    getUserApiKey: () => userApiKey,

    // GET /crypto/tokens
    getTokens: async () => {
      const response = await fetchPhaze(buildUrl('/crypto/tokens'), {
        headers: makeHeaders()
      })
      const text = await response.text()
      debugLog(
        'phaze',
        `getTokens response: ${response.status} ${response.statusText} ${text}`
      )
      return asJSON(asPhazeTokensResponse)(text)
    },

    ensureFxRates: async () => {
      await getOrFetchFxRates()
    },

    getCachedFxRates: () => cachedFxRates,

    // GET /gift-cards/:country
    getGiftCards: async params => {
      const { countryCode, currentPage = 1, perPage = 50, brandName } = params
      const [response, fxRates] = await Promise.all([
        fetchPhaze(
          buildUrl(`/gift-cards/${countryCode}`, {
            currentPage,
            perPage,
            brandName
          }),
          {
            headers: makeHeaders({ includePublicKey: true })
          }
        ),
        getOrFetchFxRates()
      ])
      const text = await response.text()
      const parsed = asJSON(asPhazeGiftCardsResponse)(text)
      return {
        ...parsed,
        brands: filterBrandsByMinimum(parsed.brands, fxRates)
      }
    },

    // GET /gift-cards/full/:country - Returns all brands without pagination
    getFullGiftCards: async params => {
      const { countryCode, fields, filter } = params
      const [response, fxRates] = await Promise.all([
        fetchPhaze(
          buildUrl(`/gift-cards/full/${countryCode}`, { fields, filter }),
          {
            headers: makeHeaders({ includePublicKey: true })
          }
        ),
        getOrFetchFxRates()
      ])
      const text = await response.text()
      const parsed = asJSON(asPhazeGiftCardsResponse)(text)
      return {
        ...parsed,
        brands: filterBrandsByMinimum(parsed.brands, fxRates)
      }
    },

    // GET /crypto/user?email=... - Lookup existing user by email
    getUserByEmail: async email => {
      const response = await fetchPhaze(buildUrl('/crypto/user', { email }), {
        headers: makeHeaders()
      })
      const text = await response.text()
      return asJSON(asPhazeRegisterUserResponse)(text)
    },

    // POST /crypto/user
    registerUser: async body => {
      const response = await fetchPhaze(buildUrl('/crypto/user'), {
        method: 'POST',
        headers: { ...makeHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const text = await response.text()
      return asJSON(asPhazeRegisterUserResponse)(text)
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
      return asJSON(asPhazeCreateOrderResponse)(text)
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
      return asJSON(asPhazeOrderStatusResponse)(text)
    }
  }
}

// ---------------------------------------------------------------------------
// Brand Filtering Utilities
// ---------------------------------------------------------------------------

/**
 * Convert USD amount to a local currency using FX rates.
 * Rates are expected to be FROM USD TO the target currency.
 * Rounds up to the next whole number to handle varying fiat precisions.
 * Returns null if no rate is found for the currency.
 */
const convertFromUsd = (
  amountUsd: number,
  toCurrency: string,
  fxRates: PhazeFxRate[]
): number | null => {
  if (toCurrency === 'USD') return amountUsd
  const rate = fxRates.find(
    r => r.fromCurrency === 'USD' && r.toCurrency === toCurrency
  )
  if (rate == null) return null
  return Math.ceil(amountUsd * rate.rate)
}

/**
 * Filter gift card brands to enforce minimum card value.
 *
 * - Fixed denomination cards: removes denominations below the minimum,
 *   and removes the brand entirely if no denominations remain.
 * - Variable amount cards: caps minVal to the minimum if below,
 *   and removes the brand if maxVal is below the minimum.
 *
 * @param brands - Array of gift card brands to filter
 * @param fxRates - FX rates from USD to other currencies
 * @param minimumUsd - Minimum card value in USD (defaults to MINIMUM_CARD_VALUE_USD)
 * @returns Filtered array of brands with valid denominations/restrictions
 */
export const filterBrandsByMinimum = (
  brands: PhazeGiftCardBrand[],
  fxRates: PhazeFxRate[],
  minimumUsd: number = MINIMUM_CARD_VALUE_USD
): PhazeGiftCardBrand[] => {
  return brands
    .map(brand => {
      const { currency, denominations, valueRestrictions } = brand

      // Convert minimum USD to brand's currency
      const minInBrandCurrency = convertFromUsd(minimumUsd, currency, fxRates)

      // If we can't convert, just return the brand as-is
      if (minInBrandCurrency == null) return brand

      // Variable amount card (has minVal/maxVal restrictions)
      if (valueRestrictions.maxVal != null) {
        // Exclude brand if maxVal is below minimum
        if (valueRestrictions.maxVal < minInBrandCurrency) {
          return null
        }

        // Cap minVal to our minimum if it's below
        const cappedMinVal =
          valueRestrictions.minVal == null
            ? minInBrandCurrency
            : Math.max(valueRestrictions.minVal, minInBrandCurrency)

        return {
          ...brand,
          valueRestrictions: {
            ...valueRestrictions,
            minVal: cappedMinVal
          }
        }
      }

      // Fixed denomination card
      if (denominations.length > 0) {
        const filteredDenoms = denominations.filter(
          denom => denom >= minInBrandCurrency
        )

        // No valid denominations remain, exclude the brand
        if (filteredDenoms.length === 0) {
          return null
        }

        // Return brand with filtered denominations
        return {
          ...brand,
          denominations: filteredDenoms
        }
      }

      // No denominations and no value restrictions - exclude
      return null
    })
    .filter((brand): brand is PhazeGiftCardBrand => brand != null)
}
