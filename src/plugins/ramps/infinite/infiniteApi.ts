import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 as keccak256 } from '@noble/hashes/sha3'
import { asMaybe } from 'cleaners'
import { base16 } from 'rfc4648'

import { ENV } from '../../../env'
import {
  asInfiniteAuthResponse,
  asInfiniteBankAccountResponse,
  asInfiniteChallengeResponse,
  asInfiniteCountriesResponse,
  asInfiniteCurrenciesResponse,
  asInfiniteCustomerAccountsResponse,
  asInfiniteCustomerResponse,
  asInfiniteErrorResponse,
  asInfiniteHttpErrorResponse,
  asInfiniteKycLinkResponse,
  asInfiniteKycStatusResponse,
  asInfiniteOtpSentResponse,
  asInfiniteQuoteResponse,
  asInfiniteTransferResponse,
  type AuthState,
  type InfiniteApi,
  type InfiniteApiConfig,
  InfiniteApiError,
  type InfiniteAuthResponse,
  type InfiniteBankAccountRequest,
  type InfiniteBankAccountResponse,
  type InfiniteChallengeResponse,
  type InfiniteCountriesResponse,
  type InfiniteCurrenciesResponse,
  type InfiniteCustomerAccountsResponse,
  type InfiniteCustomerRequest,
  type InfiniteCustomerResponse,
  type InfiniteKycLinkResponse,
  type InfiniteKycStatus,
  type InfiniteKycStatusResponse,
  type InfiniteOtpSentResponse,
  type InfiniteQuoteResponse,
  type InfiniteTransferResponse,
  type InfiniteVerifyOtpRequest
} from './infiniteApiTypes'

// Toggle between dummy data and real API per function
// Set to false to use real API for specific functions
// Example: To test real KYC flow while keeping everything else as dummy:
//   getKycStatus: false,
//   createCustomer: false,
const USE_DUMMY_DATA: Record<keyof InfiniteApi, boolean> = {
  getChallenge: false,
  verifySignature: false,
  createQuote: false,
  createTransfer: false,
  getTransferStatus: false,
  createCustomer: false,
  verifyOtp: false,
  getKycStatus: false,
  getKycLink: false,
  getCustomerAccounts: false,
  addBankAccount: false,
  getCountries: false,
  getCurrencies: false,
  createPrivateKey: false, // This is always local, no API call
  signChallenge: false, // This is always local, no API call
  getPublicKeyFromPrivate: false, // This is always local, no API call
  clearAuth: false, // This is always local, no API call
  getAuthState: false, // This is always local, no API call
  saveCustomerId: false, // This is always local, no API call
  isAuthenticated: false // This is always local, no API call
}

// Utility to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return base16.stringify(bytes).toLowerCase()
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

  // Track KYC status approval timing
  const kycApprovalTimers = new Map<string, number>()

  // Cache for bank accounts
  const bankAccountCache: InfiniteBankAccountResponse[] = []

  const makeHeaders = (options?: {
    includeAuth?: boolean // undefined means include it if its present
  }): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Organization-ID': config.orgId,
      'Content-Type': 'application/json'
    }

    const hasAuth = authState.token != null && !isTokenExpired()
    if (options?.includeAuth !== false && hasAuth) {
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

    if (ENV.DEBUG_VERBOSE_LOGGING) {
      console.log(
        `curl -X ${init?.method ?? 'GET'}${headersStr} '${urlStr}'${
          init?.body != null ? ` -d ${JSON.stringify(init?.body)}` : ''
        }`
      )
    }

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

      // Try to parse as HTTP error response
      const httpErrorResponse = asMaybe(asInfiniteHttpErrorResponse)(data)
      if (httpErrorResponse != null) {
        const detail = Array.isArray(httpErrorResponse.message)
          ? httpErrorResponse.message.join('; ')
          : httpErrorResponse.message
        throw new InfiniteApiError(
          httpErrorResponse.statusCode,
          httpErrorResponse.error,
          detail
        )
      }

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
      if (!USE_DUMMY_DATA.getChallenge) {
        const response = await fetchInfinite(
          `/v1/headless/auth/wallet/challenge?publicKey=${publicKey}`,
          {
            headers: makeHeaders()
          }
        )

        const data = await response.text()
        console.log('getChallenge response:', data)
        return asInfiniteChallengeResponse(data)
      }

      // Dummy response - updated to match new format
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = `nonce_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`
      const dummyResponse: InfiniteChallengeResponse = {
        nonce,
        message: `Sign this message to authenticate with Infinite Agents.\n\nPublicKey: ${publicKey}\nNonce: ${nonce}\nTimestamp: ${timestamp}`
      }
      return dummyResponse
    },

    verifySignature: async params => {
      if (!USE_DUMMY_DATA.verifySignature) {
        const response = await fetchInfinite(
          '/v1/headless/auth/wallet/verify',
          {
            method: 'POST',
            headers: makeHeaders(),
            body: JSON.stringify(params)
          }
        )

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
      }

      // Dummy response
      const dummyAuthResponse: InfiniteAuthResponse = {
        access_token: `dummy_token_${Date.now()}`,
        expires_in: 3600,
        customer_id: `cust_${Math.random().toString(36).substring(7)}`,
        session_id: `sess_${Math.random().toString(36).substring(7)}`,
        onboarded: true
      }

      // Store auth state
      authState = {
        customerId: dummyAuthResponse.customer_id,
        onboarded: dummyAuthResponse.onboarded,
        token: dummyAuthResponse.access_token,
        expiresAt: Date.now() + dummyAuthResponse.expires_in * 1000,
        sessionId: dummyAuthResponse.session_id,
        kycStatus: null
      }

      return dummyAuthResponse
    },

    // Quote methods
    createQuote: async params => {
      if (!USE_DUMMY_DATA.createQuote) {
        const response = await fetchInfinite('/v1/headless/quotes', {
          method: 'POST',
          headers: makeHeaders(),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        return asInfiniteQuoteResponse(data)
      }

      // Dummy response - handle both source amount and target amount
      let sourceAmount: number
      let targetAmount: number

      if (params.source.amount != null) {
        // Source amount provided
        sourceAmount = params.source.amount
        const fee = sourceAmount * 0.005 // 0.5% fee
        targetAmount =
          params.flow === 'ONRAMP' ? sourceAmount - fee : sourceAmount - fee
      } else if (params.target.amount != null) {
        // Target amount provided - calculate source
        targetAmount = params.target.amount
        const fee = targetAmount * 0.005 // 0.5% fee
        sourceAmount =
          params.flow === 'ONRAMP' ? targetAmount + fee : targetAmount + fee
      } else {
        throw new Error(
          'Either source.amount or target.amount must be provided'
        )
      }

      const dummyResponse: InfiniteQuoteResponse = {
        source: {
          amount: sourceAmount
        },
        target: {
          amount: targetAmount
        },
        expiresAt: undefined
      }

      return dummyResponse
    },

    // Transfer methods
    createTransfer: async params => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.createTransfer) {
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
      }

      // Dummy response - New format
      const dummyResponse: InfiniteTransferResponse = {
        id: `transfer_${params.type.toLowerCase()}_${Date.now()}`,
        sourceDepositInstructions:
          params.type === 'ONRAMP'
            ? {
                amount: params.amount,
                bankAccountNumber: '8312008517',
                bankRoutingNumber: '021000021',
                bankName: 'JPMorgan Chase Bank',
                toAddress: null
              }
            : {
                amount: params.amount,
                bankAccountNumber: null,
                bankRoutingNumber: null,
                bankName: null,
                toAddress: `0xdeadbeef2${params.source.currency}${
                  params.source.network
                }${Date.now().toString(16)}`
              }
      }

      return dummyResponse
    },

    getTransferStatus: async (transferId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.getTransferStatus) {
        const response = await fetchInfinite(
          `/v1/headless/transfers/${transferId}`,
          {
            headers: makeHeaders({ includeAuth: true })
          }
        )

        const data = await response.text()
        return asInfiniteTransferResponse(data)
      }

      // Dummy response - simulate a completed transfer
      const dummyResponse: InfiniteTransferResponse = {
        id: transferId,
        sourceDepositInstructions: undefined
      }

      return dummyResponse
    },

    // Customer methods
    createCustomer: async (
      params: InfiniteCustomerRequest
    ): Promise<InfiniteCustomerResponse | InfiniteOtpSentResponse> => {
      if (!USE_DUMMY_DATA.createCustomer) {
        const response = await fetchInfinite('/v1/headless/customers', {
          method: 'POST',
          headers: makeHeaders(),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        console.log('createCustomer response:', data)

        // Check if OTP was sent (existing email case)
        const otpResponse = asMaybe(asInfiniteOtpSentResponse)(data)
        if (otpResponse != null) {
          return otpResponse
        }

        return asInfiniteCustomerResponse(data)
      }

      // Dummy response - new customers start with PENDING status
      const dummyResponse: InfiniteCustomerResponse = {
        customer: {
          id: `9b0d801f-41ac-4269-abec-${Date.now()
            .toString(16)
            .padStart(12, '0')
            .substring(0, 12)}`
        }
      }

      return dummyResponse
    },

    verifyOtp: async (
      params: InfiniteVerifyOtpRequest
    ): Promise<InfiniteCustomerResponse> => {
      if (!USE_DUMMY_DATA.verifyOtp) {
        const response = await fetchInfinite(
          '/v1/headless/customers/verify-otp',
          {
            method: 'POST',
            headers: makeHeaders(),
            body: JSON.stringify(params)
          }
        )

        const data = await response.text()
        return asInfiniteCustomerResponse(data)
      }

      // Dummy response - return a customer after OTP verification
      const dummyResponse: InfiniteCustomerResponse = {
        customer: {
          id: `9b0d801f-41ac-4269-abec-${Date.now()
            .toString(16)
            .padStart(12, '0')
            .substring(0, 12)}`
        }
      }

      return dummyResponse
    },

    getKycStatus: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.getKycStatus) {
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
      }

      // Dummy response - return 'IN_REVIEW' initially, then 'ACTIVE' after 2 seconds
      let kycStatus: InfiniteKycStatus = 'IN_REVIEW'

      // Check if we've seen this customer before
      if (!kycApprovalTimers.has(customerId)) {
        // First time checking - set timer for 2 seconds from now
        kycApprovalTimers.set(customerId, Date.now() + 2000)
      } else {
        // Check if 2 seconds have passed
        const approvalTime = kycApprovalTimers.get(customerId)!
        if (Date.now() >= approvalTime) {
          kycStatus = 'ACTIVE'
        }
      }

      const dummyResponse: InfiniteKycStatusResponse = {
        kycStatus
      }

      authState.kycStatus = dummyResponse.kycStatus

      return dummyResponse
    },

    getKycLink: async (customerId: string, redirectUrl: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.getKycLink) {
        const response = await fetchInfinite(
          `/v1/headless/customers/${customerId}/kyc-link?redirectUrl=${encodeURIComponent(
            redirectUrl
          )}`,
          {
            headers: makeHeaders({ includeAuth: true })
          }
        )

        const data = await response.text()
        return asInfiniteKycLinkResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteKycLinkResponse = {
        url: `https://infinite.dev/kyc?session=kyc_sess_${Date.now()}&redirect=${encodeURIComponent(
          redirectUrl
        )}`
      }

      return dummyResponse
    },

    // Bank account methods

    getCustomerAccounts: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.getCustomerAccounts) {
        const response = await fetchInfinite(
          `/v1/headless/customers/${customerId}/accounts`,
          {
            headers: makeHeaders({ includeAuth: true })
          }
        )

        const data = await response.text()
        return asInfiniteCustomerAccountsResponse(data)
      }

      // Dummy response - transform cached bank accounts to new format
      const dummyResponse: InfiniteCustomerAccountsResponse = {
        accounts: bankAccountCache.map(account => ({
          id: account.id
        }))
      }

      return dummyResponse
    },

    addBankAccount: async (params: InfiniteBankAccountRequest) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA.addBankAccount) {
        const response = await fetchInfinite('/v1/headless/accounts', {
          method: 'POST',
          headers: makeHeaders({ includeAuth: true }),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        return asInfiniteBankAccountResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteBankAccountResponse = {
        id: `acct_bank_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      // Add to cache
      bankAccountCache.push(dummyResponse)

      return dummyResponse
    },

    // Country and currency methods
    getCountries: async () => {
      if (!USE_DUMMY_DATA.getCountries) {
        const response = await fetchInfinite('/v1/headless/countries', {
          headers: makeHeaders()
        })
        const data = await response.text()
        return asInfiniteCountriesResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteCountriesResponse = {
        countries: [
          {
            code: 'US',
            isAllowed: true,
            supportedFiatCurrencies: ['USD'],
            supportedPaymentMethods: {
              onRamp: ['ach', 'wire'],
              offRamp: ['ach', 'wire']
            },
            memberStates: undefined
          }
        ]
      }
      return dummyResponse
    },

    getCurrencies: async () => {
      if (!USE_DUMMY_DATA.getCurrencies) {
        const response = await fetchInfinite('/v1/headless/currencies', {
          headers: makeHeaders({ includeAuth: true })
        })
        const data = await response.text()
        return asInfiniteCurrenciesResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteCurrenciesResponse = {
        currencies: [
          {
            code: 'USDC',
            name: 'USD Coin',
            type: 'crypto' as const,
            supportedNetworks: [
              {
                network: 'ethereum',
                networkCode: 'ETH',
                contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                confirmationsRequired: 12
              }
            ],
            supportsOnRamp: true,
            supportsOffRamp: true,
            onRampCountries: ['US'],
            offRampCountries: ['US'],
            minAmount: '50',
            maxAmount: '50000',
            precision: 6
          },
          {
            code: 'USD',
            name: 'US Dollar',
            type: 'fiat' as const,
            supportedNetworks: undefined,
            supportsOnRamp: undefined,
            supportsOffRamp: undefined,
            onRampCountries: undefined,
            offRampCountries: undefined,
            minAmount: '50',
            maxAmount: '50000',
            precision: 2
          },
          {
            code: 'BTC',
            name: 'Bitcoin',
            type: 'crypto' as const,
            supportedNetworks: [
              {
                network: 'bitcoin',
                networkCode: 'BTC',
                contractAddress: null,
                confirmationsRequired: 6
              }
            ],
            supportsOnRamp: true,
            supportsOffRamp: true,
            onRampCountries: ['US'],
            offRampCountries: ['US'],
            minAmount: '0.001',
            maxAmount: '2',
            precision: 8
          }
        ]
      }
      return dummyResponse
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
