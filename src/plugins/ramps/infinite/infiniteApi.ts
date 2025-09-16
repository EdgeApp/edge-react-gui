import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 as keccak256 } from '@noble/hashes/sha3'
import { asMaybe } from 'cleaners'

import {
  asInfiniteAuthResponse,
  asInfiniteBankAccountResponse,
  asInfiniteChallengeResponse,
  asInfiniteCountriesResponse,
  asInfiniteCurrenciesResponse,
  asInfiniteCustomerAccountsResponse,
  asInfiniteCustomerResponse,
  asInfiniteErrorResponse,
  asInfiniteKycStatusResponse,
  asInfiniteQuoteResponse,
  asInfiniteTosResponse,
  asInfiniteTransferResponse,
  type AuthState,
  type InfiniteApi,
  type InfiniteApiConfig,
  InfiniteApiError,
  type InfiniteBankAccountRequest,
  type InfiniteBankAccountResponse,
  type InfiniteCustomerRequest
} from './infiniteApiTypes'

// Utility to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Factory function to create an API instance
export const makeInfiniteApi = (config: InfiniteApiConfig): InfiniteApi => {
  // Instance-specific auth state
  let authState: AuthState = {
    customerId: null,
    onboarded: false,
    token: null,
    expiresAt: null,
    sessionId: null,
    kycStatus: null
  }

  // Cache for bank accounts
  const bankAccountCache: InfiniteBankAccountResponse[] = []

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

  // Internal fetch wrapper that handles base URL and response checking
  const fetchInfinite: typeof fetch = async (input, init) => {
    // Handle URL construction
    const url =
      typeof input === 'string'
        ? new URL(input, config.apiUrl).toString()
        : input instanceof URL
        ? new URL(input.toString(), config.apiUrl).toString()
        : input

    // Debugging/development only:
    const urlStr = typeof url === 'string' ? url : url.url
    const headersStr =
      init?.headers != null
        ? Object.entries(init.headers)
            .map(([key, value]) => ` -H '${key}: ${value}'`)
            .join('')
        : ''
    console.log(
      `curl -X ${init?.method ?? 'GET'}${headersStr} '${urlStr}'${
        init?.body != null ? ` -d ${JSON.stringify(init?.body)}` : ''
      }`
    )

    const response = await fetch(url, init)

    if (!response.ok) {
      const data = await response.text()

      // Debugging/development only:
      console.warn(
        `Fetch infinite ${init?.method ?? 'GET'} ${urlStr} failed with status ${
          response.status
        }:`,
        data
      )

      // Try to parse as JSON error response
      const errorResponse = asMaybe(asInfiniteErrorResponse)(data)
      if (errorResponse != null) {
        throw new InfiniteApiError(
          errorResponse.status,
          errorResponse.title,
          errorResponse.detail
        )
      }

      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  }

  // API methods

  return {
    // Auth methods
    getChallenge: async (publicKey: string) => {
      const response = await fetchInfinite(
        `/v1/auth/wallet/challenge?publicKey=${publicKey}`,
        {
          headers: makeHeaders()
        }
      )

      const data = await response.text()
      console.log('getChallenge response:', data)
      return asInfiniteChallengeResponse(data)
    },

    verifySignature: async params => {
      const response = await fetchInfinite('/v1/auth/wallet/verify', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      const authResponse = asInfiniteAuthResponse(data)

      // Store auth state
      authState = {
        customerId: authResponse.customer_id,
        onboarded: authResponse.onboarded,
        token: authResponse.access_token,
        expiresAt: Date.now() + authResponse.expires_in * 1000,
        sessionId: authResponse.session_id,
        kycStatus: null
      }

      return authResponse
    },

    // Quote methods
    createQuote: async params => {
      const response = await fetchInfinite('/v1/headless/quotes', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      return asInfiniteQuoteResponse(data)
    },

    // Transfer methods
    createTransfer: async params => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      // Generate idempotency key
      const idempotencyKey = `transfer_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`

      const response = await fetchInfinite('/v1/headless/transfers', {
        method: 'POST',
        headers: {
          ...makeHeaders({ includeAuth: true }),
          'Idempotency-Key': idempotencyKey
        },
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

      const response = await fetchInfinite(
        `/v1/headless/transfers/${transferId}`,
        {
          headers: makeHeaders({ includeAuth: true })
        }
      )

      const data = await response.text()
      return asInfiniteTransferResponse(data)
    },

    // Customer methods
    createCustomer: async (params: InfiniteCustomerRequest) => {
      const response = await fetchInfinite('/v1/headless/customers', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      console.log('createCustomer response:', data)
      return asInfiniteCustomerResponse(data)
    },

    getKycStatus: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite(
        `/v1/headless/customers/${customerId}/kyc-status`,
        {
          headers: makeHeaders({ includeAuth: true })
        }
      )

      const data = await response.text()
      const kycStatusResponse = asInfiniteKycStatusResponse(data)
      authState.kycStatus = kycStatusResponse.kycStatus
      return kycStatusResponse
    },

    getTos: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite(
        `/v1/headless/customers/${customerId}/tos`,
        {
          headers: makeHeaders({ includeAuth: true })
        }
      )

      const data = await response.text()
      return asInfiniteTosResponse(data)
    },

    // Bank account methods

    getCustomerAccounts: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite(
        `/v1/headless/customers/${customerId}/accounts`,
        {
          headers: makeHeaders({ includeAuth: true })
        }
      )

      const data = await response.text()
      console.log('getCustomerAccounts response:', data)
      return asInfiniteCustomerAccountsResponse(data)
    },

    addBankAccount: async (params: InfiniteBankAccountRequest) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      const response = await fetchInfinite('/v1/headless/accounts', {
        method: 'POST',
        headers: makeHeaders({ includeAuth: true }),
        body: JSON.stringify(params)
      })

      const data = await response.text()
      return asInfiniteBankAccountResponse(data)
    },

    // Country and currency methods
    getCountries: async () => {
      const response = await fetchInfinite('/v1/headless/countries', {
        headers: makeHeaders()
      })
      const data = await response.text()
      return asInfiniteCountriesResponse(data)
    },

    getCurrencies: async () => {
      const response = await fetchInfinite('/v1/headless/currencies', {
        headers: makeHeaders({ includeAuth: true })
      })
      const data = await response.text()
      return asInfiniteCurrenciesResponse(data)
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
        customerId: null,
        onboarded: false,
        token: null,
        expiresAt: null,
        sessionId: null,
        kycStatus: null
      }
      // Clear bank account cache when clearing auth
      bankAccountCache.length = 0
    },

    getAuthState: () => {
      return authState
    },

    saveCustomerId: (customerId: string) => {
      authState.customerId = customerId
    },

    isAuthenticated: () => {
      return authState.token != null && !isTokenExpired()
    }
  }
}
