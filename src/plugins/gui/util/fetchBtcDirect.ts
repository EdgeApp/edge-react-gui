import { asMaybe, asNumber, asObject, asOptional, asString } from 'cleaners'

import { ENV } from '../../../env'

// BTC Direct Unified Checkout REST API.
// Docs: https://developer.btcdirect.eu/unified-checkout/
const PRODUCTION_BASE_URL = 'https://api.btcdirect.eu'
const SANDBOX_BASE_URL = 'https://api-sandbox.btcdirect.eu'

// Partner tokens are valid for one hour. Refresh a minute early to avoid
// using a token that expires mid-request.
const TOKEN_LIFETIME_MS = 1000 * 60 * 59
const PRICES_CACHE_MS = 1000 * 30

interface BtcDirectKeys {
  username: string
  password: string
  sandbox: boolean
}

interface AuthState {
  token: string
  expiresAt: number
}
let authState: AuthState | undefined

interface PricesCache {
  data: BtcDirectPrices
  expiresAt: number
}
let pricesCache: PricesCache | undefined

function getBtcDirectKeys(): BtcDirectKeys {
  const keys = ENV.PLUGIN_API_KEYS.btcdirect
  if (keys == null) {
    throw new Error('No BTC Direct API keys found')
  }
  return {
    username: keys.username,
    password: keys.password,
    sandbox: keys.sandbox ?? false
  }
}

function getBaseUrl(sandbox: boolean): string {
  return sandbox ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL
}

async function btcDirectFetch(
  baseUrl: string,
  endpoint: string,
  init: RequestInit
): Promise<unknown> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      // This will blow up if we pass `headers` as an array:
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      ...init.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to fetch BTC Direct ${endpoint}: ${response.status} - ${text}`
    )
  }
  return await response.json()
}

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

export const asBtcDirectAuth = asObject({
  token: asString,
  refreshToken: asOptional(asString)
})

async function getAuthToken(keys: BtcDirectKeys): Promise<string> {
  const now = Date.now()
  if (authState != null && authState.expiresAt > now) {
    return authState.token
  }

  const data = await btcDirectFetch(
    getBaseUrl(keys.sandbox),
    '/api/v1/authenticate',
    {
      method: 'POST',
      body: JSON.stringify({
        username: keys.username,
        password: keys.password
      })
    }
  )

  const { token } = asBtcDirectAuth(data)
  authState = { token, expiresAt: now + TOKEN_LIFETIME_MS }
  return token
}

// -----------------------------------------------------------------------------
// Prices
// -----------------------------------------------------------------------------

export type BtcDirectCurrency = ReturnType<typeof asBtcDirectCurrency>
const asBtcDirectCurrency = asObject({
  code: asString,
  name: asOptional(asString),
  decimals: asOptional(asNumber),
  smartContractAddress: asOptional(asString),
  caip19: asOptional(asString)
}).withRest

export type BtcDirectPricePair = ReturnType<typeof asBtcDirectPricePair>
const asBtcDirectPricePair = asObject({
  sourceCurrency: asBtcDirectCurrency,
  targetCurrency: asObject({ code: asString }).withRest,
  buy: asNumber,
  sell: asNumber
}).withRest

export type BtcDirectPrices = ReturnType<typeof asBtcDirectPrices>
// Keyed by pair, e.g. "BTC-EUR". Unknown shapes clean to undefined so a single
// malformed pair does not blow up the whole map.
const asBtcDirectPrices = asObject(asMaybe(asBtcDirectPricePair))

export async function fetchBtcDirectPrices(): Promise<BtcDirectPrices> {
  const now = Date.now()
  if (pricesCache != null && pricesCache.expiresAt > now) {
    return pricesCache.data
  }

  const keys = getBtcDirectKeys()
  const token = await getAuthToken(keys)
  const data = await btcDirectFetch(
    getBaseUrl(keys.sandbox),
    '/api/v2/prices',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }
  )

  const prices = asBtcDirectPrices(data)
  pricesCache = { data: prices, expiresAt: now + PRICES_CACHE_MS }
  return prices
}

// -----------------------------------------------------------------------------
// Checkout
// -----------------------------------------------------------------------------

export interface BtcDirectCheckoutParams {
  baseCurrency: string
  quoteCurrency: string
  paymentMethod: string
  walletAddress: string
  quoteCurrencyAmount?: number
  baseCurrencyAmount?: number
  returnUrl?: string
  partnerOrderIdentifier?: string
}

export type BtcDirectCheckout = ReturnType<typeof asBtcDirectCheckout>
const asBtcDirectCheckout = asObject({
  checkoutUrl: asString
}).withRest

export async function createBtcDirectCheckout(
  params: BtcDirectCheckoutParams
): Promise<BtcDirectCheckout> {
  const keys = getBtcDirectKeys()
  const token = await getAuthToken(keys)
  const data = await btcDirectFetch(
    getBaseUrl(keys.sandbox),
    '/api/v2/buy/checkout',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(params)
    }
  )
  return asBtcDirectCheckout(data)
}
