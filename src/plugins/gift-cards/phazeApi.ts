import { asMaybe } from 'cleaners'

import { ENV } from '../../env'
import {
  asPhazeCreateOrderResponse,
  asPhazeError,
  asPhazeGiftCardsResponse,
  asPhazeRegisterUserResponse,
  asPhazeTokensResponse,
  asPhazeUser,
  type PhazeCreateOrderRequest,
  type PhazeRegisterUserRequest
} from './phazeGiftCardTypes'

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
  registerUser: (
    body: PhazeRegisterUserRequest
  ) => Promise<ReturnType<typeof asPhazeRegisterUserResponse>>
  createOrder: (
    body: PhazeCreateOrderRequest
  ) => Promise<ReturnType<typeof asPhazeCreateOrderResponse>>
  getOrderStatus: (params: {
    quoteId?: string
    currentPage?: number
  }) => Promise<ReturnType<typeof asPhazeRegisterUserResponse> | ReturnType<typeof asPhazeUser> | any> // not used; kept for parity
  getOrdersStatus: (params: {
    quoteId?: string
    currentPage?: number
  }) => Promise<ReturnType<typeof asPhazeRegisterUserResponse> | any>
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
    if (opts?.includeUserKey && userApiKey != null) {
      headers['user-api-key'] = userApiKey
    }
    if (opts?.includePublicKey && config.publicKey != null) {
      headers['public-key'] = config.publicKey
    }
    return headers
  }

  const buildUrl = (path: string, query?: Record<string, any>): string => {
    const url = new URL(path, config.baseUrl)
    if (query != null) {
      for (const [k, v] of Object.entries(query)) {
        if (v == null) continue
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  const fetchPhaze: typeof fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? new URL(input, config.baseUrl).toString()
        : input instanceof URL
        ? new URL(input.toString(), config.baseUrl).toString()
        : input

    // Debug curl line if verbose logging is on:
    const urlStr = typeof url === 'string' ? url : url.url
    const headersStr =
      init?.headers != null
        ? Object.entries(init.headers as Record<string, string>)
            .map(([key, value]) => ` -H '${key}: ${value}'`)
            .join('')
        : ''
    if (ENV.DEBUG_VERBOSE_LOGGING) {
      console.log(
        `curl -X ${init?.method ?? 'GET'}${headersStr} '${urlStr}'${
          init?.body != null ? ` -d ${JSON.stringify(init?.body)}` : ''
        }`
      )
    }

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
      // The cleaner for status is multidata; return raw JSON to be consumed
      return safeJson(text)
    },

    // Alias that mirrors plural semantics (useful for paging)
    getOrdersStatus: async params => {
      return await this.getOrderStatus(params as any)
    }
  }
}


