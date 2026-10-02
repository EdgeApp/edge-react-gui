import {
  asArray,
  asEither,
  asMaybe,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'

export interface BtcDirectApiOptions {
  /**
   * The base URL to use for BTC Direct API requests.
   * Production: https://api.btcdirect.eu
   * Sandbox: https://api-sandbox.btcdirect.eu
   */
  apiUrl: string
  username: string
  password: string
}

export interface BtcDirectQuoteParams {
  currencyPair: string
  paymentMethod: string
  fiatAmount: number
}

export interface BtcDirectCheckoutParams {
  baseCurrency: string
  quoteCurrency: string
  paymentMethod: string
  quoteCurrencyAmount: number
  walletAddress: string
  returnUrl: string
  partnerOrderIdentifier: string
}

export interface BtcDirectApi {
  fetchCurrencyPairs: () => Promise<BtcDirectCurrencyPair[]>
  fetchPaymentMethods: () => Promise<BtcDirectPaymentMethods>
  fetchQuote: (params: BtcDirectQuoteParams) => Promise<BtcDirectQuote>
  createCheckout: (
    params: BtcDirectCheckoutParams
  ) => Promise<BtcDirectCheckout>
}

// The partner token is valid for one hour. Refresh a little early:
const TOKEN_TTL_MS = 55 * 60 * 1000

// -----------------------------------------------------------------------------
// Cleaners
// -----------------------------------------------------------------------------

const asBtcDirectAuth = asObject({
  token: asString
})

const asBtcDirectLimit = asObject({
  amount: asNumber,
  currencyCode: asString
})

export type BtcDirectCurrencyPair = ReturnType<typeof asBtcDirectCurrencyPair>
export const asBtcDirectCurrencyPair = asObject({
  currencyPair: asString,
  baseCurrency: asObject({
    code: asString,
    caip19: asOptional(asEither(asString, asNull))
  }),
  quoteCurrency: asObject({
    code: asString
  }),
  buy: asObject({
    status: asString,
    min: asOptional(asBtcDirectLimit),
    max: asOptional(asBtcDirectLimit)
  })
})

// Skip pairs we cannot parse instead of failing the whole list:
const asBtcDirectCurrencyPairs = asArray(asMaybe(asBtcDirectCurrencyPair))

export type BtcDirectPaymentMethod = ReturnType<typeof asBtcDirectPaymentMethod>
const asBtcDirectPaymentMethod = asObject({
  code: asString,
  limit: asOptional(asNumber)
})

export type BtcDirectPaymentMethods = ReturnType<
  typeof asBtcDirectPaymentMethods
>
const asBtcDirectPaymentMethods = asObject({
  paymentMethods: asArray(asBtcDirectPaymentMethod),
  /** Lowercase country code -> payment method codes */
  countries: asObject(asArray(asString))
})

export type BtcDirectQuote = ReturnType<typeof asBtcDirectQuote>
const asBtcDirectQuote = asObject({
  fiatAmount: asNumber,
  cryptoAmount: asNumber,
  expiryDate: asOptional(asString)
})

export type BtcDirectCheckout = ReturnType<typeof asBtcDirectCheckout>
const asBtcDirectCheckout = asObject({
  checkoutUrl: asString
})

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

/**
 * Caches a pending request, so parallel calls share one fetch.
 * A failed request is forgotten, so the next call retries.
 */
export function makeCachedPromise<T>(
  fetcher: () => Promise<T>,
  ttlMs: number
): { get: () => Promise<T>; clear: () => void } {
  let cached: Promise<T> | undefined
  let timestamp = 0

  return {
    async get() {
      if (cached != null && Date.now() - timestamp < ttlMs) {
        return await cached
      }
      const pending = fetcher()
      cached = pending
      timestamp = Date.now()
      pending.catch(() => {
        if (cached === pending) cached = undefined
      })
      return await pending
    },
    clear() {
      cached = undefined
    }
  }
}

export function makeBtcDirectApi(options: BtcDirectApiOptions): BtcDirectApi {
  const { apiUrl, username, password } = options

  async function readJson(url: string, response: Response): Promise<unknown> {
    if (!response.ok) {
      const text = await response.text()
      throw new Error(
        `Failed to fetch BTC Direct ${url}: ${response.status} - ${text}`
      )
    }
    return await response.json()
  }

  const token = makeCachedPromise(async (): Promise<string> => {
    const url = `${apiUrl}/api/v1/authenticate`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    return asBtcDirectAuth(await readJson(url, response)).token
  }, TOKEN_TTL_MS)

  async function fetchAuthed(
    endpoint: string,
    body?: object
  ): Promise<unknown> {
    const url = `${apiUrl}${endpoint}`
    const send = async (): Promise<Response> =>
      await fetch(url, {
        method: body == null ? 'GET' : 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${await token.get()}`,
          ...(body == null ? {} : { 'Content-Type': 'application/json' })
        },
        body: body == null ? undefined : JSON.stringify(body)
      })

    let response = await send()
    if (response.status === 401) {
      // The token was revoked or expired early, so sign in again once:
      token.clear()
      response = await send()
    }
    return await readJson(url, response)
  }

  return {
    async fetchCurrencyPairs() {
      const data = await fetchAuthed('/api/v1/system/currency-pairs')
      const pairs: BtcDirectCurrencyPair[] = []
      for (const pair of asBtcDirectCurrencyPairs(data)) {
        if (pair != null) pairs.push(pair)
      }
      return pairs
    },

    async fetchPaymentMethods() {
      const data = await fetchAuthed('/api/v1/buy/payment-methods/preferred')
      return asBtcDirectPaymentMethods(data)
    },

    async fetchQuote(params) {
      const data = await fetchAuthed('/api/v1/buy/quote', params)
      return asBtcDirectQuote(data)
    },

    async createCheckout(params) {
      const data = await fetchAuthed('/api/v2/buy/checkout', params)
      return asBtcDirectCheckout(data)
    }
  }
}
