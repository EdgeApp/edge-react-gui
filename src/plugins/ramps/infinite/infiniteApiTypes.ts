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

// Transfer response - New format for headless API
export const asInfiniteTransferResponse = asJSON(
  asObject({
    id: asString,
    type: asInfiniteQuoteFlow,
    status: asString, // "PENDING", "AWAITING_FUNDS", "IN_REVIEW", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"
    stage: asString,
    amount: asNumber,
    currency: asString,
    source: asObject({
      currency: asString,
      network: asString,
      accountId: asEither(asString, asNull),
      fromAddress: asEither(asString, asNull)
    }),
    destination: asObject({
      currency: asString,
      network: asString,
      accountId: asEither(asString, asNull),
      toAddress: asEither(asString, asNull)
    }),
    sourceDepositInstructions: asOptional(
      asObject({
        network: asString,
        currency: asString,
        amount: asNumber,
        depositMessage: asEither(asString, asNull),
        bankAccountNumber: asEither(asString, asNull),
        bankRoutingNumber: asEither(asString, asNull),
        bankBeneficiaryName: asEither(asString, asNull),
        bankName: asEither(asString, asNull),
        toAddress: asEither(asString, asNull),
        fromAddress: asEither(asString, asNull)
      })
    ),
    createdAt: asString,
    updatedAt: asString
  })
)

// Legacy transfer response for backwards compatibility
export const asInfiniteTransferResponseLegacy = asJSON(
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
  'REJECTED',
  'PENDING'
)
export type InfiniteCustomerStatus = ReturnType<typeof asInfiniteCustomerStatus>

// Customer request - flattened structure (no nested data object)
export const asInfiniteCustomerRequest = asObject({
  type: asInfiniteCustomerType,
  countryCode: asString,
  contactInformation: asObject({
    email: asString
  }),
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
  )
})

// Customer response - kycLinkUrl and usedPersonaKyc removed, use getKycLink endpoint
export const asInfiniteCustomerResponse = asJSON(
  asObject({
    customer: asObject({
      id: asString,
      type: asString,
      status: asInfiniteCustomerStatus,
      countryCode: asString,
      createdAt: asString
    })
  })
)

// Bank account types - API expects camelCase
export const asInfiniteBankAccountRequest = asObject({
  type: asValue('bank_account'),
  bankName: asString,
  accountName: asString,
  accountOwnerName: asString,
  accountNumber: asString,
  routingNumber: asString
})

// Bank account response - API returns camelCase
export const asInfiniteBankAccountResponse = asJSON(
  asObject({
    id: asString,
    type: asValue('bank_account'),
    bankName: asString,
    accountName: asString,
    last4: asString,
    verificationStatus: asString
  })
)

// Get Customer Accounts response
export const asInfiniteCustomerAccountsResponse = asJSON(
  asObject({
    accounts: asArray(
      asObject({
        id: asString,
        type: asString, // "EXTERNAL_BANK_ACCOUNT", "EXTERNAL_WALLET_ACCOUNT"
        status: asString, // "ACTIVE", "PENDING", "INACTIVE"
        currency: asString,
        bankName: asOptional(asString),
        accountNumber: asOptional(asString), // Masked like "****1234"
        routingNumber: asOptional(asString), // Masked like "****0021"
        accountType: asOptional(asString), // "checking", "savings"
        holderName: asString,
        createdAt: asString,
        metadata: asObject({
          externalAccountId: asEither(asString, asNull),
          verificationStatus: asString
        })
      })
    ),
    totalCount: asNumber
  })
)

// KYC Status types (Infinite format)
export const asInfiniteKycStatus = asValue(
  'PENDING',
  'IN_REVIEW',
  'ACTIVE',
  'NEED_ACTIONS',
  'REJECTED'
)
export type InfiniteKycStatus = ReturnType<typeof asInfiniteKycStatus>

export const asInfiniteKycStatusResponse = asJSON(
  asObject({
    customerId: asString,
    kycStatus: asInfiniteKycStatus,
    sessionStatus: asOptional(asString),
    kycCompletedAt: asOptional(asString)
  })
)

// KYC Link response - separate endpoint from customer creation
export const asInfiniteKycLinkResponse = asJSON(
  asObject({
    url: asString,
    organizationName: asOptional(asString),
    branding: asOptional(
      asObject({
        primaryColor: asOptional(asString),
        secondaryColor: asOptional(asString),
        logoUrl: asOptional(asString),
        companyName: asOptional(asString)
      })
    )
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

// Error response types
export const asInfiniteErrorResponse = asJSON(
  asObject({
    title: asString,
    status: asNumber,
    detail: asString,
    instance: asString
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
export type InfiniteCustomerAccountsResponse = ReturnType<
  typeof asInfiniteCustomerAccountsResponse
>
export type InfiniteKycStatusResponse = ReturnType<
  typeof asInfiniteKycStatusResponse
>
export type InfiniteKycLinkResponse = ReturnType<
  typeof asInfiniteKycLinkResponse
>
export type InfiniteCountriesResponse = ReturnType<
  typeof asInfiniteCountriesResponse
>
export type InfiniteCurrenciesResponse = ReturnType<
  typeof asInfiniteCurrenciesResponse
>
export type InfiniteErrorResponse = ReturnType<typeof asInfiniteErrorResponse>

// Custom error class for API errors
export class InfiniteApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail: string
  ) {
    super(detail)
    this.name = 'InfiniteApiError'
  }
}

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
    amount: number
    source: {
      currency: string
      network: string
      accountId?: string
      fromAddress?: string
    }
    destination: {
      currency: string
      network: string
      accountId?: string
      toAddress?: string
    }
    clientReferenceId?: string
    developerFee?: string
  }) => Promise<InfiniteTransferResponse>

  getTransferStatus: (transferId: string) => Promise<InfiniteTransferResponse>

  // Customer methods
  createCustomer: (
    params: InfiniteCustomerRequest
  ) => Promise<InfiniteCustomerResponse>
  getKycStatus: (customerId: string) => Promise<InfiniteKycStatusResponse>
  getKycLink: (
    customerId: string,
    redirectUrl: string
  ) => Promise<InfiniteKycLinkResponse>

  // Bank account methods
  getCustomerAccounts: (
    customerId: string
  ) => Promise<InfiniteCustomerAccountsResponse>
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
  saveCustomerId: (customerId: string) => void
  isAuthenticated: () => boolean
}
