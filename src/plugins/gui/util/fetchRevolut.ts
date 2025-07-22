import {
  asArray,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import { ENV } from '../../../env'

const baseUrl = 'https://ramp-partners.revolut.com'
// const baseUrl = 'https://ramp-partners.revolut.codes' // For testing

async function fetchRevolut(endpoint: string, init?: RequestInit) {
  const apiKey = ENV.PLUGIN_API_KEYS.revolut?.apiKey
  if (!apiKey) {
    throw new Error('No Revolut API key found')
  }
  const url = `${baseUrl}${endpoint}`
  const response = await fetch(url, {
    method: 'GET',
    ...init,
    headers: {
      ...init?.headers,
      Accept: 'application/json',
      'X-API-KEY': apiKey
    }
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to fetch Revolut ${endpoint}: ${response.status} - ${text}`
    )
  }
  const data = await response.json()
  return data
}

// -----------------------------------------------------------------------------
// Revolut Config
// -----------------------------------------------------------------------------

export async function fetchRevolutConfig(): Promise<RevolutConfig> {
  const data = await fetchRevolut('/partners/api/2.0/config')
  return asRevolutConfig(data)
}

export type RevolutCrypto = ReturnType<typeof asRevolutCrypto>
export const asRevolutCrypto = asObject({
  id: asString,
  currency: asString,
  blockchain: asString,
  smartContractAddress: asOptional(asString)
})

export type RevolutFiat = ReturnType<typeof asRevolutFiat>
export const asRevolutFiat = asObject({
  currency: asString,
  min_limit: asNumber,
  max_limit: asNumber
})

export type RevolutConfig = ReturnType<typeof asRevolutConfig>
const asRevolutConfig = asObject({
  version: asString,
  countries: asArray(asString),
  fiat: asArray(asRevolutFiat),
  crypto: asArray(asRevolutCrypto),
  payment_methods: asArray(
    asValue('card', 'revolut', 'apple-pay', 'google-pay')
  )
})

// -----------------------------------------------------------------------------
// Revolut Quote
// -----------------------------------------------------------------------------

export interface RevolutQuoteParams {
  /**
   * The ISO 4217 code of the selected fiat currency to use for the purchase.
   */
  fiat: string

  /**
   * The fiat amount to exchange for crypto.
   */
  amount: string

  /**
   * The ID of the crypto token to purchase, obtained from the /config endpoint.
   */
  crypto: string

  /**
   * The selected payment option.
   * @example 'card' | 'revolut' | 'apple-pay' | 'google-pay'
   */
  payment: string

  /**
   * The ISO 3166 Alpha-2 code of the country of residence of the customer
   * (end user) ordering the exchange.
   * @example 'GB'
   */
  region: string

  /**
   * The fee percentage that will be applied for the order as partner fee.
   */
  feePercentage?: number

  /**
   * The address of the crypto wallet into which the purchased token should
   * be transferred.
   */
  walletAddress?: string
}

export async function fetchRevolutQuote(
  params: RevolutQuoteParams
): Promise<PartnerQuote> {
  const urlParams = new URLSearchParams()
  urlParams.set('fiat', params.fiat)
  urlParams.set('amount', params.amount)
  urlParams.set('crypto', params.crypto)
  urlParams.set('payment', params.payment)
  urlParams.set('region', params.region)
  if (params.feePercentage) {
    urlParams.set('feePercentage', params.feePercentage.toString())
  }
  if (params.walletAddress) {
    urlParams.set('walletAddress', params.walletAddress)
  }
  const data = await fetchRevolut(
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    `/partners/api/2.0/quote?${urlParams.toString()}`
  )
  return asPartnerQuote(data)
}

export type PartnerQuote = ReturnType<typeof asPartnerQuote>
const asPartnerQuote = asObject({
  service_fee: asObject({
    amount: asNumber,
    currency: asString
  }),
  network_fee: asObject({
    amount: asNumber,
    currency: asString
  }),
  crypto: asObject({
    amount: asNumber,
    currencyId: asString
  }),
  partner_fee: asObject({
    amount: asNumber,
    currency: asString
  })
})

// -----------------------------------------------------------------------------
// Revolut Redirect URL
// -----------------------------------------------------------------------------

export interface RevolutRedirectUrlParams {
  /**
   * The ISO 4217 code of the selected fiat currency to use for the purchase.
   */
  fiat: string

  /**
   * The fiat amount to exchange for crypto.
   */
  amount: number

  /**
   * The ID of the crypto token to purchase, obtained from the /config endpoint.
   */
  crypto: string

  /**
   * The selected payment option.
   * Possible values: [card, revolut, apple-pay, google-pay]
   */
  payment: string

  /**
   * The ISO 3166 Alpha-2 code of the country of residence of the customer
   * (end user) ordering the exchange.
   * Example: "GB"
   */
  region: string

  /**
   * The address of the crypto wallet into which to transfer the purchased
   * token.
   */
  wallet: string

  /**
   * The external identifier of the order to be made. Should be either UUID or
   *  ULID.
   */
  orderId?: string

  /**
   * The fee percentage that will be applied for the order as partner fee.
   */
  feePercentage?: number

  /**
   * The URL to which to redirect the customer after the purchase – for example,
   * your website.
   * If not provided, the customer is shown transaction result in Revolut Ramp.
   */
  partnerRedirectUrl?: string

  /**
   * A prefix that allows passing arbitrary key-value pairs. For each pair, the
   * prefix and key should be separated by .
   * Pattern: Value must match regular expression
   * `additionalProperties.[key]=[value]
   * If such additional properties are provided, when you call the /orders
   * endpoint, they are returned along with the order details.
   */
  additionalProperties?: string
}

export async function fetchRevolutRedirectUrl(
  params: RevolutRedirectUrlParams
): Promise<RevolutRedirectUrl> {
  const urlParams = new URLSearchParams()
  urlParams.set('fiat', params.fiat)
  urlParams.set('amount', params.amount.toString())
  urlParams.set('crypto', params.crypto)
  urlParams.set('payment', params.payment)
  urlParams.set('region', params.region)
  urlParams.set('wallet', params.wallet)
  if (params.orderId != null) {
    urlParams.set('orderId', params.orderId)
  }
  if (params.feePercentage != null) {
    urlParams.set('feePercentage', params.feePercentage.toString())
  }
  if (params.partnerRedirectUrl != null) {
    urlParams.set('partnerRedirectUrl', params.partnerRedirectUrl)
  }
  if (params.additionalProperties != null) {
    urlParams.set('additionalProperties', params.additionalProperties)
  }

  const data = await fetchRevolut(
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    `/partners/api/2.0/buy?${urlParams.toString()}`
  )
  return asRevolutRedirectUrl(data)
}

export type RevolutRedirectUrl = ReturnType<typeof asRevolutRedirectUrl>
const asRevolutRedirectUrl = asObject({
  ramp_redirect_url: asString
})
