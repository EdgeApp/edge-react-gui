import { secp256k1 } from '@noble/curves/secp256k1'
import { sha256 } from '@noble/hashes/sha2'

import { cleanFetch } from '../../../util/cleanFetch'
import {
  asInfiniteAuthResponse,
  asInfiniteBankAccountResponse,
  asInfiniteBankAccountsResponse,
  asInfiniteChallengeResponse,
  asInfiniteCustomerResponse,
  // asInfiniteQuoteResponse,
  asInfiniteTransferResponse,
  type AuthState,
  type InfiniteApi,
  type InfiniteApiConfig,
  type InfiniteBankAccountRequest,
  type InfiniteCustomerRequest,
  type InfiniteQuoteResponse
} from './infiniteApiTypes'

// Utility to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Dummy quote function for development
const dummyQuote = (): InfiniteQuoteResponse => ({
  quoteId: 'dummy-quote-123',
  flow: 'ONRAMP',
  source: {
    asset: 'USD',
    amount: 100,
    network: undefined
  },
  target: {
    asset: 'USDC',
    amount: 99.5,
    network: 'polygon'
  },
  fee: 0.5,
  infiniteFee: 0.3,
  edgeFee: 0.2,
  totalReceived: 99.5,
  rate: 0.995,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
})

// Factory function to create an API instance
export const makeInfiniteApi = (config: InfiniteApiConfig): InfiniteApi => {
  // Instance-specific auth state
  let authState: AuthState = {
    token: null,
    expiresAt: null,
    userId: null,
    sessionId: null
  }

  const makeHeaders = (options?: {
    includeAuth?: boolean // undefined means include it if its present
  }): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Organization-ID': config.orgId,
      'Content-Type': 'application/json'
    }

    // Determine if we should include auth
    const shouldIncludeAuth =
      options?.includeAuth ?? (authState.token != null && !isTokenExpired())

    if (shouldIncludeAuth && authState.token != null && !isTokenExpired()) {
      headers.Authorization = `Bearer ${authState.token}`
    }

    return headers
  }

  const isTokenExpired = (): boolean => {
    if (authState.expiresAt == null) return true
    return Date.now() >= authState.expiresAt
  }

  // Create fetchers for each endpoint
  const fetchChallenge = cleanFetch<
    { publicKey: string },
    ReturnType<typeof asInfiniteChallengeResponse>
  >({
    asResponse: asInfiniteChallengeResponse,
    resource: ({ payload }) =>
      payload?.publicKey != null
        ? new URL(
            `/auth/wallet/challenge?publicKey=${payload.publicKey}`,
            config.apiUrl
          )
        : undefined
  })

  const fetchVerify = cleanFetch({
    asResponse: asInfiniteAuthResponse,
    resource: new URL('/auth/wallet/verify', config.apiUrl),
    options: { method: 'POST' }
  })

  // const fetchQuote = cleanFetch({
  //   asResponse: asInfiniteQuoteResponse,
  //   resource: new URL('/v2/quotes', config.apiUrl),
  //   options: { method: 'POST' }
  // })

  const fetchTransfer = cleanFetch({
    asResponse: asInfiniteTransferResponse,
    resource: new URL('/transfers', config.apiUrl),
    options: { method: 'POST' }
  })

  const fetchTransferStatus = cleanFetch<
    { transferId: string },
    ReturnType<typeof asInfiniteTransferResponse>
  >({
    asResponse: asInfiniteTransferResponse,
    resource: ({ payload }) =>
      payload?.transferId != null
        ? new URL(`/transfers/${payload.transferId}`, config.apiUrl)
        : undefined
  })

  const fetchCreateCustomer = cleanFetch({
    asResponse: asInfiniteCustomerResponse,
    resource: new URL('/customers', config.apiUrl),
    options: { method: 'POST' }
  })

  const fetchBankAccounts = cleanFetch({
    asResponse: asInfiniteBankAccountsResponse,
    resource: new URL('/accounts', config.apiUrl)
  })

  const fetchAddBankAccount = cleanFetch({
    asResponse: asInfiniteBankAccountResponse,
    resource: new URL('/accounts', config.apiUrl),
    options: { method: 'POST' }
  })

  return {
    // Auth methods
    getChallenge: async (publicKey: string) => {
      return await fetchChallenge({
        headers: makeHeaders(),
        payload: { publicKey }
      })
    },

    verifySignature: async params => {
      const response = await fetchVerify({
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      // Store auth state
      authState = {
        token: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
        userId: response.user_id,
        sessionId: response.session_id
      }

      return response
    },

    // Quote methods
    createQuote: async _params => {
      return dummyQuote() // TODO: Remove this dev dummy response
    },

    // Transfer methods
    createTransfer: async params => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      return await fetchTransfer({
        headers: makeHeaders({ includeAuth: true }),
        body: JSON.stringify(params)
      })
    },

    getTransferStatus: async (transferId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      return await fetchTransferStatus({
        headers: makeHeaders({ includeAuth: true }),
        payload: { transferId }
      })
    },

    // Customer methods
    createCustomer: async (params: InfiniteCustomerRequest) => {
      return await fetchCreateCustomer({
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })
    },

    // Bank account methods
    getBankAccounts: async () => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      return await fetchBankAccounts({
        headers: makeHeaders({ includeAuth: true })
      })
    },

    addBankAccount: async (params: InfiniteBankAccountRequest) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      return await fetchAddBankAccount({
        headers: makeHeaders({ includeAuth: true }),
        body: JSON.stringify(params)
      })
    },

    // Crypto methods
    createPrivateKey: () => {
      // Generate random 32 bytes for private key
      const privateKey = new Uint8Array(32)
      crypto.getRandomValues(privateKey)
      return privateKey
    },

    signChallenge: (message: string, privateKey: Uint8Array) => {
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message)

      // Hash the message with SHA-256
      const messageHash = sha256(messageBytes)

      // Sign the hash
      const signature = secp256k1.sign(messageHash, privateKey)

      // Convert signature to hex with 0x prefix
      const sigBytes = signature.toCompactRawBytes()
      return '0x' + bytesToHex(sigBytes)
    },

    getPublicKeyFromPrivate: (privateKey: Uint8Array) => {
      const publicKey = secp256k1.getPublicKey(privateKey, false) // uncompressed
      // Return as hex string with 0x prefix
      return '0x' + bytesToHex(publicKey)
    },

    // Utility methods
    clearAuth: () => {
      authState = {
        token: null,
        expiresAt: null,
        userId: null,
        sessionId: null
      }
    },

    getAuthState: () => {
      return { ...authState }
    },

    isAuthenticated: () => {
      return authState.token != null && !isTokenExpired()
    }
  }
}
