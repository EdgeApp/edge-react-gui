import {
  asArray,
  asBoolean,
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

export const asMetadata = asObject({
  contractAddress: asEither(asString, asNull),
  networkCode: asString
})

export const asMoonpayCurrency = asObject({
  type: asValue('crypto', 'fiat'),
  code: asString,
  name: asString,
  maxAmount: asEither(asNumber, asNull),
  minAmount: asEither(asNumber, asNull),
  maxBuyAmount: asEither(asNumber, asNull),
  minBuyAmount: asEither(asNumber, asNull),
  maxSellAmount: asOptional(asNumber),
  minSellAmount: asOptional(asNumber),
  metadata: asOptional(asMetadata),
  isSellSupported: asOptional(asBoolean),
  isSuspended: asOptional(asBoolean),
  isSupportedInUS: asOptional(asBoolean)
})
export type MoonpayCurrency = ReturnType<typeof asMoonpayCurrency>

export const asMoonpayCurrencies = asArray(asMoonpayCurrency)

export const asMoonpaySellQuote = asObject({
  baseCurrencyCode: asString,
  baseCurrencyAmount: asNumber,
  quoteCurrencyAmount: asNumber
})

export const asMoonpayBuyQuote = asObject({
  baseCurrencyCode: asString,
  baseCurrencyAmount: asNumber,
  quoteCurrencyAmount: asNumber,
  quoteCurrencyCode: asString,
  totalAmount: asNumber
})

export const asMoonpayQuote = asEither(asMoonpayBuyQuote, asMoonpaySellQuote)

// Cleaner for Moonpay GET /v1/transactions/:id response
export const asMoonpayTransaction = asObject({
  baseCurrencyAmount: asNumber,
  quoteCurrencyAmount: asNumber,
  feeAmount: asOptional(asNumber),
  status: asString
})

export const asState = asObject({
  code: asString,
  isBuyAllowed: asBoolean,
  isSellAllowed: asBoolean,
  isAllowed: asBoolean
})

export const asMoonpayCountry = asObject({
  alpha2: asString,
  isAllowed: asBoolean,
  isBuyAllowed: asBoolean,
  isSellAllowed: asBoolean,
  states: asOptional(asArray(asState))
})

export const asMoonpayCountries = asArray(asMoonpayCountry)

export const asApiKeys = asString

// Init options cleaner for moonpay ramp plugin
export const asInitOptions = asObject({
  apiKey: asOptional(asString),
  apiUrl: asOptional(asString, 'https://api.moonpay.com'),
  buyWidgetUrl: asOptional(asString, 'https://buy.moonpay.com'),
  sellWidgetUrl: asOptional(asString, 'https://sell.moonpay.com')
})

export type MoonpayPaymentMethod =
  | 'ach_bank_transfer'
  | 'credit_debit_card'
  | 'paypal'
  | 'venmo'
  | 'gbp_bank_transfer'

export interface MoonpayWidgetQueryParams {
  apiKey: string
  lockAmount: true
  showAllCurrencies: false
  paymentMethod: MoonpayPaymentMethod
  redirectURL: string
}

export type MoonpayBuyWidgetQueryParams = MoonpayWidgetQueryParams & {
  currencyCode: string
  baseCurrencyCode: string
  walletAddress: string
  enableRecurringBuys: false
  quoteCurrencyAmount?: number
  baseCurrencyAmount?: number
}

export type MoonpaySellWidgetQueryParams = MoonpayWidgetQueryParams & {
  quoteCurrencyCode: string
  baseCurrencyCode: string
  refundWalletAddress: string
  quoteCurrencyAmount?: number
  baseCurrencyAmount?: number
}
