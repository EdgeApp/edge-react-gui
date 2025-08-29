import {
  asArray,
  asBoolean,
  asEither,
  asJSON,
  asNull,
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
export const asInfiniteChallengeResponse = asJSON(
  asObject({
    nonce: asString,
    message: asString,
    domain: asOptional(asNull),
    expires_at: asNumber,
    expires_at_iso: asString
  })
)

// Auth verify response
export const asInfiniteAuthResponse = asJSON(
  asObject({
    access_token: asString,
    token_type: asString,
    expires_in: asNumber,
    customer_id: asEither(asString, asNull),
    session_id: asString,
    platform: asString,
    onboarded: asBoolean
  })
)

// Quote request types
export const asInfiniteQuoteFlow = asValue('ONRAMP', 'OFFRAMP')
export type InfiniteQuoteFlow = ReturnType<typeof asInfiniteQuoteFlow>

// Quote response
export const asInfiniteQuoteResponse = asJSON(
  asObject({
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
    expiresAt: asOptional(asString)
  })
)

// Transfer response
export const asInfiniteTransferResponse = asJSON(
  asObject({
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
)

// Customer types
export const asInfiniteCustomerType = asValue('individual', 'business')
export type InfiniteCustomerType = ReturnType<typeof asInfiniteCustomerType>

export const asInfiniteCustomerStatus = asValue(
  'ACTIVE',
  'UNDER_REVIEW',
  'SUSPENDED',
  'REJECTED'
)
export type InfiniteCustomerStatus = ReturnType<typeof asInfiniteCustomerStatus>

// Customer request
export const asInfiniteCustomerRequest = asObject({
  type: asInfiniteCustomerType,
  countryCode: asString,
  data: asObject({
    personalInfo: asOptional(
      asObject({
        firstName: asString,
        lastName: asString
      })
    ),
    companyInformation: asOptional(
      asObject({
        legalName: asString,
        website: asOptional(asString)
      })
    ),
    contactInformation: asObject({
      email: asString
    })
  })
})

// Customer response
export const asInfiniteCustomerResponse = asJSON(
  asObject({
    customer: asObject({
      id: asString,
      type: asString,
      status: asInfiniteCustomerStatus,
      countryCode: asString,
      createdAt: asString
    }),
    schemaDocumentUploadUrls: asOptional(asNull),
    kycLinkUrl: asString,
    usedPersonaKyc: asBoolean
  })
)

// Bank account types
export const asInfiniteBankAccountRequest = asObject({
  type: asValue('bank_account'),
  bank_name: asString,
  account_number: asString,
  routing_number: asString,
  account_name: asString,
  account_owner_name: asString
})

const asInfiniteBankAccountResponseInner = asObject({
  id: asString,
  type: asValue('bank_account'),
  bank_name: asString,
  account_name: asString,
  last_4: asString,
  verification_status: asString
})

export const asInfiniteBankAccountResponse = asJSON(
  asInfiniteBankAccountResponseInner
)

export const asInfiniteBankAccountsResponse = asJSON(
  asArray(asInfiniteBankAccountResponseInner)
)

// KYC Status types (from Bridge)
export const asInfiniteKycStatus = asValue(
  'not_started',
  'incomplete',
  'awaiting_ubo',
  'under_review',
  'approved',
  'rejected',
  'paused',
  'offboarded'
)
export type InfiniteKycStatus = ReturnType<typeof asInfiniteKycStatus>

export const asInfiniteKycStatusResponse = asJSON(
  asObject({
    customerId: asString,
    kycStatus: asInfiniteKycStatus,
    kycCompletedAt: asOptional(asString)
    // Note: approvedLimit removed in new API
  })
)

// Countries response
export const asInfiniteCountriesResponse = asJSON(
  asObject({
    countries: asArray(
      asObject({
        code: asString,
        name: asString,
        isAllowed: asBoolean,
        supportedFiatCurrencies: asArray(asString),
        supportedPaymentMethods: asObject({
          onRamp: asArray(asString),
          offRamp: asArray(asString)
        }),
        memberStates: asOptional(asArray(asString))
      })
    )
  })
)

// Currencies response
export const asInfiniteCurrenciesResponse = asJSON(
  asObject({
    currencies: asArray(
      asObject({
        code: asString,
        name: asString,
        type: asValue('crypto', 'fiat'),
        supportedNetworks: asOptional(
          asArray(
            asObject({
              network: asString,
              networkCode: asString,
              contractAddress: asEither(asString, asNull),
              confirmationsRequired: asNumber
            })
          )
        ),
        supportedPaymentRails: asOptional(asArray(asString)),
        countryCode: asOptional(asString),
        supportsOnRamp: asOptional(asBoolean),
        supportsOffRamp: asOptional(asBoolean),
        onRampCountries: asOptional(asArray(asString)),
        offRampCountries: asOptional(asArray(asString)),
        minAmount: asString,
        maxAmount: asString,
        precision: asNumber
      })
    )
  })
)

// Error response
export const asInfiniteErrorResponse = asJSON(
  asObject({
    error: asObject({
      code: asString,
      message: asString,
      details: asOptional(asObject({}))
    })
  })
)

// Type exports
export type InfiniteChallengeResponse = ReturnType<
  typeof asInfiniteChallengeResponse
>
export type InfiniteAuthResponse = ReturnType<typeof asInfiniteAuthResponse>
export type InfiniteQuoteResponse = ReturnType<typeof asInfiniteQuoteResponse>
export type InfiniteTransferResponse = ReturnType<
  typeof asInfiniteTransferResponse
>
export type InfiniteCustomerRequest = ReturnType<
  typeof asInfiniteCustomerRequest
>
export type InfiniteCustomerResponse = ReturnType<
  typeof asInfiniteCustomerResponse
>
export type InfiniteBankAccountRequest = ReturnType<
  typeof asInfiniteBankAccountRequest
>
export type InfiniteBankAccountResponse = ReturnType<
  typeof asInfiniteBankAccountResponse
>
export type InfiniteBankAccountsResponse = ReturnType<
  typeof asInfiniteBankAccountsResponse
>
export type InfiniteKycStatusResponse = ReturnType<
  typeof asInfiniteKycStatusResponse
>
export type InfiniteCountriesResponse = ReturnType<
  typeof asInfiniteCountriesResponse
>
export type InfiniteCurrenciesResponse = ReturnType<
  typeof asInfiniteCurrenciesResponse
>
export type InfiniteErrorResponse = ReturnType<typeof asInfiniteErrorResponse>

// Auth state management
export interface AuthState {
  customerId: string | null
  onboarded: boolean
  token: string | null
  expiresAt: number | null
  sessionId: string | null
  kycStatus: InfiniteKycStatus | null
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
      amount?: number
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

  // Customer methods
  createCustomer: (
    params: InfiniteCustomerRequest
  ) => Promise<InfiniteCustomerResponse>
  getKycStatus: (customerId: string) => Promise<InfiniteKycStatusResponse>

  // Bank account methods
  getBankAccounts: () => Promise<InfiniteBankAccountsResponse>
  addBankAccount: (
    params: InfiniteBankAccountRequest
  ) => Promise<InfiniteBankAccountResponse>

  // Country and currency methods
  getCountries: () => Promise<InfiniteCountriesResponse>
  getCurrencies: () => Promise<InfiniteCurrenciesResponse>

  // Crypto methods
  createPrivateKey: () => Uint8Array
  signChallenge: (message: string, privateKey: Uint8Array) => string
  getPublicKeyFromPrivate: (privateKey: Uint8Array) => string

  // Utility methods
  clearAuth: () => void
  getAuthState: () => AuthState
  isAuthenticated: () => boolean
}
