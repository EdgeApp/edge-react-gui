import { asObject, asOptional, asString } from 'cleaners'

// Re-export types from fetchRevolut for convenience
export type {
  RevolutConfig,
  RevolutCrypto,
  RevolutFiat,
  RevolutQuoteParams,
  PartnerQuote,
  RevolutRedirectUrlParams,
  RevolutRedirectUrl
} from '../../gui/util/fetchRevolut'

// Init options cleaner for revolut ramp plugin
export const asInitOptions = asObject({
  apiKey: asString,
  apiUrl: asOptional(asString, 'https://ramp-partners.revolut.com')
})

export type InitOptions = ReturnType<typeof asInitOptions>
