import { asArray, asEither, asNumber, asObject, asString } from 'cleaners'

import type { ProviderToken } from '../rampPluginTypes'

// Init options for Simplex plugin
export const asInitOptions = asObject({
  partner: asString,
  jwtTokenProvider: asString,
  publicKey: asString
})

export type InitOptions = ReturnType<typeof asInitOptions>

// Simplex API response types
export const asSimplexFiatCurrency = asObject({
  ticker_symbol: asString,
  min_amount: asString,
  max_amount: asString
})

export const asSimplexQuoteError = asObject({
  error: asString,
  type: asString
})

export const asSimplexQuoteSuccess = asObject({
  digital_money: asObject({
    currency: asString,
    amount: asNumber
  }),
  fiat_money: asObject({
    currency: asString,
    amount: asNumber
  })
})

export const asSimplexQuote = asEither(
  asSimplexQuoteSuccess,
  asSimplexQuoteError
)
export const asSimplexFiatCurrencies = asArray(asSimplexFiatCurrency)
export const asSimplexCountries = asArray(asString)
export const asInfoJwtSignResponse = asObject({ token: asString })

export type SimplexQuote = ReturnType<typeof asSimplexQuote>
export type SimplexQuoteSuccess = ReturnType<typeof asSimplexQuoteSuccess>
export type SimplexFiatCurrency = ReturnType<typeof asSimplexFiatCurrency>

// Extended token interface for Simplex mappings
export interface SimplexTokenMapping extends ProviderToken {
  pluginId: string
  simplexCode: string
}

// Simplex-specific constants
export const SIMPLEX_SUPPORTED_PAYMENT_TYPES = {
  applepay: true,
  credit: true,
  googlepay: true
} as const

export type SimplexPaymentType = keyof typeof SIMPLEX_SUPPORTED_PAYMENT_TYPES

// JWT data structures
export interface SimplexJwtData {
  ts: number
  euid: string
  crad: string
  crcn: string
  ficn: string
  fiam: number
}

export interface SimplexQuoteJwtData {
  euid: string
  ts: number
  soam: number
  socn: string
  tacn: string
}

// API URLs
export const SIMPLEX_PARTNER_URL = 'https://partners.simplex.com'
export const SIMPLEX_API_URL = 'https://api.simplexcc.com/v2'

// Caching duration (24 hours in milliseconds)
export const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

// Error types
export const SIMPLEX_ERROR_TYPES = {
  INVALID_AMOUNT_LIMIT: 'invalidAmountLimit',
  AMOUNT_LIMIT_EXCEEDED: 'amount_Limit_exceeded',
  QUOTE_ERROR: 'quote_error'
} as const

export type SimplexErrorType =
  (typeof SIMPLEX_ERROR_TYPES)[keyof typeof SIMPLEX_ERROR_TYPES]
