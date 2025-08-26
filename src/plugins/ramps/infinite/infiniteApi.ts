import { secp256k1 } from '@noble/curves/secp256k1'
import { keccak_256 as keccak256 } from '@noble/hashes/sha3'

import {
  asInfiniteAuthResponse,
  asInfiniteBankAccountResponse,
  asInfiniteBankAccountsResponse,
  asInfiniteChallengeResponse,
  asInfiniteCountriesResponse,
  asInfiniteCurrenciesResponse,
  asInfiniteCustomerResponse,
  asInfiniteKycStatusResponse,
  asInfiniteQuoteResponse,
  asInfiniteTransferResponse,
  type AuthState,
  type InfiniteApi,
  type InfiniteApiConfig,
  type InfiniteAuthResponse,
  type InfiniteBankAccountRequest,
  type InfiniteBankAccountResponse,
  type InfiniteBankAccountsResponse,
  type InfiniteChallengeResponse,
  type InfiniteCountriesResponse,
  type InfiniteCurrenciesResponse,
  type InfiniteCustomerRequest,
  type InfiniteCustomerResponse,
  type InfiniteKycStatus,
  type InfiniteKycStatusResponse,
  type InfiniteQuoteResponse,
  type InfiniteTransferResponse
} from './infiniteApiTypes'

// Toggle between dummy data and real API
const USE_DUMMY_DATA = true // Set to false to use real API

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

  // Track KYC status approval timing
  const kycApprovalTimers = new Map<string, number>()

  // Cache for bank accounts
  const bankAccountCache: InfiniteBankAccountResponse[] = []

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
      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite(
          `/v1/auth/wallet/challenge?publicKey=${publicKey}`,
          {
            headers: makeHeaders()
          }
        )

        const data = await response.text()
        return asInfiniteChallengeResponse(data)
      }

      // Dummy response - updated to match new format
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = `nonce_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`
      const dummyResponse: InfiniteChallengeResponse = {
        nonce,
        message: `Sign this message to authenticate with Infinite Agents.\n\nPublicKey: ${publicKey}\nNonce: ${nonce}\nTimestamp: ${timestamp}`,
        expires_at: timestamp + 300,
        expires_at_iso: new Date((timestamp + 300) * 1000).toISOString()
      }
      return dummyResponse
    },

    verifySignature: async params => {
      if (!USE_DUMMY_DATA) {
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
      }

      // Dummy response
      const dummyAuthResponse: InfiniteAuthResponse = {
        access_token: `dummy_token_${Date.now()}`,
        customer_id: `cust_${Math.random().toString(36).substring(7)}`,
        token_type: 'Bearer',
        expires_in: 3600,
        session_id: `sess_${Math.random().toString(36).substring(7)}`,
        platform: params.platform,
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
      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite('/v2/quotes', {
          method: 'POST',
          headers: makeHeaders(),
          body: JSON.stringify({ ...params, paymentMethod: 'ACH' })
        })

        const data = await response.text()
        return asInfiniteQuoteResponse(data)
      }

      // Dummy response
      const fee = params.source.amount * 0.005 // 0.5% fee
      const targetAmount =
        params.flow === 'ONRAMP'
          ? params.source.amount - fee
          : params.source.amount + fee

      const dummyResponse: InfiniteQuoteResponse = {
        quoteId: `quote_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        flow: params.flow,
        source: {
          asset: params.source.asset,
          amount: params.source.amount,
          network: params.source.network
        },
        target: {
          asset: params.target.asset,
          amount: targetAmount,
          network: params.target.network
        },
        fee: params.flow === 'ONRAMP' ? fee : undefined,
        infiniteFee: params.flow === 'OFFRAMP' ? fee * 0.6 : undefined,
        edgeFee: params.flow === 'OFFRAMP' ? fee * 0.4 : undefined,
        totalReceived: params.flow === 'OFFRAMP' ? targetAmount : undefined,
        rate: params.flow === 'ONRAMP' ? 0.995 : undefined,
        expiresAt: new Date(Date.now() + 300000).toISOString()
      }

      return dummyResponse
    },

    // Transfer methods
    createTransfer: async params => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite('/transfers', {
          method: 'POST',
          headers: makeHeaders({ includeAuth: true }),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        return asInfiniteTransferResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteTransferResponse = {
        data: {
          id: `transfer_${params.type.toLowerCase()}_${Date.now()}`,
          organizationId: 'org_edge_wallet_main',
          type: params.type,
          source: {
            asset:
              params.type === 'ONRAMP' ? 'USD' : params.source.asset || 'USDC',
            amount: params.source.amount || 1000,
            network:
              params.type === 'ONRAMP'
                ? 'ach_push'
                : params.source.network || 'ethereum'
          },
          destination: {
            asset:
              params.type === 'ONRAMP'
                ? params.destination.asset || 'USDC'
                : 'USD',
            amount: (params.source.amount || 1000) * 0.995,
            network:
              params.type === 'ONRAMP'
                ? params.destination.network || 'ethereum'
                : 'ach_push'
          },
          status: 'Pending',
          stage:
            params.type === 'ONRAMP' ? 'awaiting_funds' : 'awaiting_crypto',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: undefined,
          sourceDepositInstructions:
            params.type === 'ONRAMP'
              ? {
                  amount: 1000,
                  currency: 'USD',
                  paymentRail: 'ach_push',
                  bank: {
                    name: 'Lead Bank',
                    accountNumber: '1000682791',
                    routingNumber: '101206101'
                  },
                  accountHolder: {
                    name: 'Infinite Payments LLC'
                  },
                  memo: `TRANSFER_${Date.now()}`,
                  depositAddress: undefined
                }
              : {
                  amount: undefined,
                  currency: undefined,
                  paymentRail: 'ethereum',
                  bank: undefined,
                  accountHolder: undefined,
                  depositAddress: `0x${Math.random()
                    .toString(16)
                    .substring(2, 42)
                    .padEnd(40, '0')}`,
                  memo: `TRANSFER_${Date.now()}`
                },
          fees: []
        }
      }

      return dummyResponse
    },

    getTransferStatus: async (transferId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite(`/transfers/${transferId}`, {
          headers: makeHeaders({ includeAuth: true })
        })

        const data = await response.text()
        return asInfiniteTransferResponse(data)
      }

      // Dummy response - simulate a completed transfer
      const dummyResponse: InfiniteTransferResponse = {
        data: {
          id: transferId,
          organizationId: 'org_edge_wallet_main',
          type: 'ONRAMP',
          source: {
            asset: 'USD',
            amount: 1000,
            network: 'ach_push'
          },
          destination: {
            asset: 'USDC',
            amount: 995,
            network: 'ethereum'
          },
          status: 'Completed',
          stage: 'completed',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          sourceDepositInstructions: undefined,
          fees: []
        }
      }

      return dummyResponse
    },

    // Customer methods
    createCustomer: async (params: InfiniteCustomerRequest) => {
      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite('/v1/headless/customers', {
          method: 'POST',
          headers: makeHeaders(),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        console.log('createCustomer response:', data)
        return asInfiniteCustomerResponse(data)
      }

      // Dummy response - updated with UUID format
      const dummyResponse: InfiniteCustomerResponse = {
        customer: {
          id: `9b0d801f-41ac-4269-abec-${Date.now()
            .toString(16)
            .padStart(12, '0')
            .substring(0, 12)}`,
          type: params.type === 'individual' ? 'INDIVIDUAL' : 'BUSINESS',
          status: 'ACTIVE',
          countryCode: params.countryCode,
          createdAt: new Date().toISOString()
        },
        schemaDocumentUploadUrls: null,
        kycLinkUrl: `http://localhost:5223/v1/kyc?session=${Date.now()}&callback=edge%3A%2F%2Fkyc-complete`,
        usedPersonaKyc: true
      }

      return dummyResponse
    },

    getKycStatus: async (customerId: string) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA) {
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

      // Dummy response - return 'under_review' initially, then 'approved' after 2 seconds
      let kycStatus: InfiniteKycStatus = 'under_review'

      // Check if we've seen this customer before
      if (!kycApprovalTimers.has(customerId)) {
        // First time checking - set timer for 2 seconds from now
        kycApprovalTimers.set(customerId, Date.now() + 2000)
      } else {
        // Check if 2 seconds have passed
        const approvalTime = kycApprovalTimers.get(customerId)!
        if (Date.now() >= approvalTime) {
          kycStatus = 'approved'
        }
      }

      const dummyResponse: InfiniteKycStatusResponse = {
        customerId,
        kycStatus,
        kycCompletedAt:
          kycStatus === 'approved' ? new Date().toISOString() : undefined
      }

      authState.kycStatus = dummyResponse.kycStatus

      return dummyResponse
    },

    // Bank account methods
    getBankAccounts: async () => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite('/accounts', {
          headers: makeHeaders({ includeAuth: true })
        })

        const data = await response.text()
        return asInfiniteBankAccountsResponse(data)
      }

      // Dummy response - return cached bank accounts
      const dummyResponse: InfiniteBankAccountsResponse = [...bankAccountCache]

      return dummyResponse
    },

    addBankAccount: async (params: InfiniteBankAccountRequest) => {
      // Check if we need to authenticate
      if (authState.token == null || isTokenExpired()) {
        throw new Error('Authentication required')
      }

      if (!USE_DUMMY_DATA) {
        const response = await fetchInfinite('/accounts', {
          method: 'POST',
          headers: makeHeaders({ includeAuth: true }),
          body: JSON.stringify(params)
        })

        const data = await response.text()
        return asInfiniteBankAccountResponse(data)
      }

      // Dummy response
      const dummyResponse: InfiniteBankAccountResponse = {
        id: `acct_bank_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        type: 'bank_account',
        bank_name: params.bank_name,
        account_name: params.account_name,
        last_4: params.account_number.slice(-4),
        verification_status: 'pending'
      }

      // Add to cache
      bankAccountCache.push(dummyResponse)

      return dummyResponse
    },

    // Country and currency methods
    getCountries: async () => {
      if (!USE_DUMMY_DATA) {
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
            name: 'United States',
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
      if (!USE_DUMMY_DATA) {
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
              },
              {
                network: 'polygon',
                networkCode: 'POLYGON',
                contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                confirmationsRequired: 30
              },
              {
                network: 'arbitrum',
                networkCode: 'ARB',
                contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                confirmationsRequired: 1
              },
              {
                network: 'optimism',
                networkCode: 'OP',
                contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                confirmationsRequired: 1
              },
              {
                network: 'base',
                networkCode: 'BASE',
                contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                confirmationsRequired: 1
              },
              {
                network: 'solana',
                networkCode: 'SOL',
                contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                confirmationsRequired: 1
              }
            ],
            supportedPaymentRails: undefined,
            countryCode: undefined,
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
            supportedPaymentRails: ['ach', 'wire'],
            countryCode: 'US',
            supportsOnRamp: undefined,
            supportsOffRamp: undefined,
            onRampCountries: undefined,
            offRampCountries: undefined,
            precision: 2,
            minAmount: '50',
            maxAmount: '50000'
          },
          {
            code: 'BTC',
            name: 'Bitcoin',
            type: 'crypto' as const,
            supportedNetworks: [
              {
                network: 'bitcoin',
                networkCode: 'BTC',
                contractAddress: '',
                confirmationsRequired: 6
              }
            ],
            supportedPaymentRails: undefined,
            countryCode: undefined,
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

    isAuthenticated: () => {
      return authState.token != null && !isTokenExpired()
    }
  }
}
