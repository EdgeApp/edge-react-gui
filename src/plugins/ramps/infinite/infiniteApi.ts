import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 as keccak256 } from '@noble/hashes/sha3'

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
    sessionId: null
  }

  const makeHeaders = (options?: {
    includeAuth?: boolean // undefined means include it if its present
  }): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Organization-ID': config.orgId,
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
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

  // Internal fetch wrapper that handles base URL and response checking
  const fetchInfinite: typeof fetch = async (input, init) => {
    // Handle URL construction
    const url =
      typeof input === 'string'
        ? new URL(input, config.apiUrl).toString()
        : input instanceof URL
        ? new URL(input.toString(), config.apiUrl).toString()
        : input

    const response = await fetch(url, init)

    if (!response.ok) {
      const data = await response.text()
      const urlStr = typeof url === 'string' ? url : url.url
      console.log(
        `Fetch infinite ${init?.method ?? 'GET'} ${urlStr} failed with status ${
          response.status
        }:`,
        data
      )
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  }

  // API methods

  return {
    // Auth methods
    getChallenge: async (publicKey: string) => {
      const response = await fetchInfinite(
        `/auth/wallet/challenge?publicKey=${publicKey}`,
        {
          headers: makeHeaders()
        }
      )

      const data = await response.text()
      return asInfiniteChallengeResponse(data)
    },

    verifySignature: async params => {
      const response = await fetchInfinite('/auth/wallet/verify', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      const authResponse = asInfiniteAuthResponse(data)

      // Store auth state
      authState = {
        token: authResponse.access_token,
        expiresAt: Date.now() + authResponse.expires_in * 1000,
        sessionId: authResponse.session_id
      }

      return authResponse
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

      const response = await fetchInfinite('/transfers', {
        method: 'POST',
        headers: makeHeaders({ includeAuth: true }),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      return asInfiniteTransferResponse(data)
    },

    getTransferStatus: async (transferId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite(`/transfers/${transferId}`, {
        headers: makeHeaders({ includeAuth: true })
      })

      const data = await response.text()
      return asInfiniteTransferResponse(data)
    },

    // Customer methods
    createCustomer: async (params: InfiniteCustomerRequest) => {
      const response = await fetchInfinite('/customers', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      console.log('createCustomer response:', data)
      return asInfiniteCustomerResponse(data)
    },

    // Bank account methods
    getBankAccounts: async () => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite('/accounts', {
        headers: makeHeaders({ includeAuth: true })
      })

      const data = await response.text()
      return asInfiniteBankAccountsResponse(data)
    },

    addBankAccount: async (params: InfiniteBankAccountRequest) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite('/accounts', {
        method: 'POST',
        headers: makeHeaders({ includeAuth: true }),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      return asInfiniteBankAccountResponse(data)
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

      // Create the EIP-191 personal sign message format
      // "\x19Ethereum Signed Message:\n" + message.length + message
      const prefix = '\x19Ethereum Signed Message:\n' + messageBytes.length
      const prefixBytes = new TextEncoder().encode(prefix)

      // Concatenate prefix and message
      const fullMessage = new Uint8Array(
        prefixBytes.length + messageBytes.length
      )
      fullMessage.set(prefixBytes)
      fullMessage.set(messageBytes, prefixBytes.length)

      // Hash with Keccak256 (not SHA-256)
      const messageHash = keccak256(fullMessage)

      // Sign the hash
      const signature = secp256k1.sign(messageHash, privateKey)

      // Convert signature to hex with 0x prefix, including recovery id (v)
      const sigR = signature.r.toString(16).padStart(64, '0')
      const sigS = signature.s.toString(16).padStart(64, '0')
      const sigV = (signature.recovery + 27).toString(16).padStart(2, '0')

      // Return in the format r + s + v
      return '0x' + sigR + sigS + sigV
    },

    getPublicKeyFromPrivate: (privateKey: Uint8Array) => {
      // Get the uncompressed public key (0x04 + X + Y)
      const uncompressedPublicKey = secp256k1.getPublicKey(privateKey, false)

      // Remove the 0x04 prefix byte - Ethereum hashes only the x,y coordinates
      const publicKeyWithoutPrefix = uncompressedPublicKey.slice(1)

      // Hash the public key coordinates using Keccak256
      const hashedKey = keccak256(publicKeyWithoutPrefix)

      // Take the last 20 bytes (rightmost 160 bits) to get the Ethereum address
      const ethereumAddress = hashedKey.slice(-20)

      // Return as hex string with 0x prefix
      return '0x' + bytesToHex(ethereumAddress)
    },

    // Utility methods
    clearAuth: () => {
      authState = {
        token: null,
        expiresAt: null,
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
