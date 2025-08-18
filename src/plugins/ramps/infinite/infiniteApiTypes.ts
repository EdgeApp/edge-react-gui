import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

// API Configuration
export interface InfiniteApiConfig {
  apiUrl: string
  orgId: string
}

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
export interface AuthState {
  token: string | null
  expiresAt: number | null
  userId: string | null
  sessionId: string | null
}

// API instance interface
export interface InfiniteApi {
  // Auth methods
  getChallenge: (publicKey: string) => Promise<InfiniteChallengeResponse>
  verifySignature: (params: {
    public_key: string
    signature: string
    nonce: string
    platform: string
  }) => Promise<InfiniteAuthResponse>

  // Quote methods
  createQuote: (params: {
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
  }) => Promise<InfiniteQuoteResponse>

  // Transfer methods
  createTransfer: (params: {
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
  }) => Promise<InfiniteTransferResponse>

  getTransferStatus: (transferId: string) => Promise<InfiniteTransferResponse>

  // Utility methods
  clearAuth: () => void
  getAuthState: () => AuthState
  isAuthenticated: () => boolean
}
