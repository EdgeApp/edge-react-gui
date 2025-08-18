import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import { fetchInfo } from '../../../util/network'

// API Configuration
export interface InfiniteApiConfig {
  apiKey: string
  apiUrl: string
  orgId: string
}

// API Type Definitions and Cleaners

// Auth challenge response
export const asInfiniteChallengeResponse = asObject({
  nonce: asString,
  message: asString,
  domain: asString,
  expires_at: asNumber,
  expires_at_iso: asString,
  expires_in: asNumber
})

// Auth verify response
export const asInfiniteAuthResponse = asObject({
  access_token: asString,
  token_type: asString,
  expires_in: asNumber,
  user_id: asString,
  session_id: asString,
  platform: asString,
  onboarded: asBoolean
})

// Quote request types
export const asInfiniteQuoteFlow = asValue('ONRAMP', 'OFFRAMP')
export type InfiniteQuoteFlow = ReturnType<typeof asInfiniteQuoteFlow>

// Quote response
export const asInfiniteQuoteResponse = asObject({
  quoteId: asString,
  flow: asInfiniteQuoteFlow,
  source: asObject({
    asset: asString,
    amount: asNumber,
    network: asOptional(asString)
  }),
  target: asObject({
    asset: asString,
    amount: asNumber,
    network: asOptional(asString)
  }),
  fee: asOptional(asNumber),
  infiniteFee: asOptional(asNumber),
  edgeFee: asOptional(asNumber),
  totalReceived: asOptional(asNumber),
  rate: asOptional(asNumber),
  expiresAt: asString
})

// Transfer response
export const asInfiniteTransferResponse = asObject({
  data: asObject({
    id: asString,
    organizationId: asString,
    type: asInfiniteQuoteFlow,
    source: asObject({
      asset: asString,
      amount: asNumber,
      network: asString
    }),
    destination: asObject({
      asset: asString,
      amount: asNumber,
      network: asString
    }),
    status: asString,
    stage: asString,
    createdAt: asString,
    updatedAt: asString,
    completedAt: asOptional(asString),
    sourceDepositInstructions: asOptional(
      asObject({
        amount: asOptional(asNumber),
        currency: asOptional(asString),
        paymentRail: asOptional(asString),
        bank: asOptional(
          asObject({
            name: asString,
            accountNumber: asString,
            routingNumber: asString
          })
        ),
        accountHolder: asOptional(
          asObject({
            name: asString
          })
        ),
        memo: asOptional(asString),
        depositAddress: asOptional(asString)
      })
    ),
    fees: asArray(asObject({}))
  })
})

// Error response
export const asInfiniteErrorResponse = asObject({
  error: asObject({
    code: asString,
    message: asString,
    details: asOptional(asObject({}))
  })
})

// Type exports
export type InfiniteChallengeResponse = ReturnType<
  typeof asInfiniteChallengeResponse
>
export type InfiniteAuthResponse = ReturnType<typeof asInfiniteAuthResponse>
export type InfiniteQuoteResponse = ReturnType<typeof asInfiniteQuoteResponse>
export type InfiniteTransferResponse = ReturnType<
  typeof asInfiniteTransferResponse
>
export type InfiniteErrorResponse = ReturnType<typeof asInfiniteErrorResponse>

// Auth state management
interface AuthState {
  token: string | null
  expiresAt: number | null
  userId: string | null
  sessionId: string | null
}

let authState: AuthState = {
  token: null,
  expiresAt: null,
  userId: null,
  sessionId: null
}

const makeHeaders = (
  config: InfiniteApiConfig,
  includeAuth = false
): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Organization-ID': config.orgId,
    'Content-Type': 'application/json'
  }

  if (includeAuth && authState.token != null) {
    headers.Authorization = `Bearer ${authState.token}`
  }

  return headers
}

const isTokenExpired = (): boolean => {
  if (authState.expiresAt == null) return true
  return Date.now() >= authState.expiresAt
}

export const infiniteApi = {
  // Auth methods
  getChallenge: async (
    config: InfiniteApiConfig,
    publicKey: string
  ): Promise<InfiniteChallengeResponse> => {
    const response = await fetchInfo(
      `${config.apiUrl}/auth/wallet/challenge?publicKey=${publicKey}`,
      {
        method: 'GET',
        headers: makeHeaders(config)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      const error = asInfiniteErrorResponse(errorData)
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }

    const data = await response.json()
    return asInfiniteChallengeResponse(data)
  },

  verifySignature: async (
    config: InfiniteApiConfig,
    params: {
      public_key: string
      signature: string
      nonce: string
      platform: string
    }
  ): Promise<InfiniteAuthResponse> => {
    const response = await fetchInfo(`${config.apiUrl}/auth/wallet/verify`, {
      method: 'POST',
      headers: makeHeaders(config),
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json()
      const error = asInfiniteErrorResponse(errorData)
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }

    const data = await response.json()
    const authResponse = asInfiniteAuthResponse(data)

    // Store auth state
    authState = {
      token: authResponse.access_token,
      expiresAt: Date.now() + authResponse.expires_in * 1000,
      userId: authResponse.user_id,
      sessionId: authResponse.session_id
    }

    return authResponse
  },

  // Quote methods
  createQuote: async (
    config: InfiniteApiConfig,
    params: {
      flow: InfiniteQuoteFlow
      source: {
        asset: string
        amount: number
        network?: string
      }
      target: {
        asset: string
        amount?: number
        network?: string
      }
    }
  ): Promise<InfiniteQuoteResponse> => {
    // Check if we need to authenticate
    if (authState.token == null || isTokenExpired()) {
      throw new Error('Authentication required')
    }

    const response = await fetchInfo(`${config.apiUrl}/v2/quotes`, {
      method: 'POST',
      headers: makeHeaders(config, true),
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json()
      const error = asInfiniteErrorResponse(errorData)
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }

    const data = await response.json()
    return asInfiniteQuoteResponse(data)
  },

  // Transfer methods
  createTransfer: async (
    config: InfiniteApiConfig,
    params: {
      type: InfiniteQuoteFlow
      quoteId: string
      source: {
        accountId?: string
        address?: string
        asset?: string
        amount?: number
        network?: string
      }
      destination: {
        accountId?: string
        address?: string
        asset?: string
        network?: string
      }
      autoExecute: boolean
    }
  ): Promise<InfiniteTransferResponse> => {
    // Check if we need to authenticate
    if (authState.token == null || isTokenExpired()) {
      throw new Error('Authentication required')
    }

    const response = await fetchInfo(`${config.apiUrl}/transfers`, {
      method: 'POST',
      headers: makeHeaders(config, true),
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json()
      const error = asInfiniteErrorResponse(errorData)
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }

    const data = await response.json()
    return asInfiniteTransferResponse(data)
  },

  getTransferStatus: async (
    config: InfiniteApiConfig,
    transferId: string
  ): Promise<InfiniteTransferResponse> => {
    // Check if we need to authenticate
    if (authState.token == null || isTokenExpired()) {
      throw new Error('Authentication required')
    }

    const response = await fetchInfo(
      `${config.apiUrl}/transfers/${transferId}`,
      {
        method: 'GET',
        headers: makeHeaders(config, true)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      const error = asInfiniteErrorResponse(errorData)
      throw new Error(`${error.error.code}: ${error.error.message}`)
    }

    const data = await response.json()
    return asInfiniteTransferResponse(data)
  },

  // Utility methods
  clearAuth: (): void => {
    authState = {
      token: null,
      expiresAt: null,
      userId: null,
      sessionId: null
    }
  },

  getAuthState: (): AuthState => {
    return { ...authState }
  },

  isAuthenticated: (): boolean => {
    return authState.token != null && !isTokenExpired()
  }
}
