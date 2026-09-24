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

// ---------------------------------------------------------------------------
// Init options
// ---------------------------------------------------------------------------

export const asInitOptions = asObject({
  apiUrl: asOptional(asString, 'https://api.dfx.swiss'),
  webAppUrl: asOptional(asString, 'https://app.dfx.swiss')
})

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const asDfxAuthResponse = asObject({
  accessToken: asString
})

// ---------------------------------------------------------------------------
// Provider config (public endpoints)
// ---------------------------------------------------------------------------

export const asDfxFiat = asObject({
  id: asNumber,
  name: asString,
  buyable: asBoolean,
  sellable: asBoolean
})
export type DfxFiat = ReturnType<typeof asDfxFiat>
export const asDfxFiats = asArray(asDfxFiat)

export const asDfxAsset = asObject({
  id: asNumber,
  name: asString,
  uniqueName: asString,
  blockchain: asString,
  chainId: asOptional(asEither(asString, asNull)),
  buyable: asBoolean,
  sellable: asBoolean
})
export type DfxAsset = ReturnType<typeof asDfxAsset>
export const asDfxAssets = asArray(asDfxAsset)

export const asDfxCountry = asObject({
  symbol: asString,
  locationAllowed: asOptional(asBoolean),
  bankAllowed: asOptional(asBoolean)
})
export type DfxCountry = ReturnType<typeof asDfxCountry>
export const asDfxCountries = asArray(asDfxCountry)

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export const asDfxQuote = asObject({
  estimatedAmount: asNumber,
  amount: asOptional(asNumber),
  minVolume: asNumber,
  maxVolume: asNumber,
  fees: asOptional(
    asObject({
      rate: asNumber
    })
  ),
  isValid: asOptional(asBoolean),
  error: asOptional(asString)
})
export type DfxQuote = ReturnType<typeof asDfxQuote>

// ---------------------------------------------------------------------------
// Buy payment info
// ---------------------------------------------------------------------------

export const asDfxBuyPaymentInfo = asObject({
  id: asNumber,
  uid: asString,
  iban: asOptional(asString),
  bic: asOptional(asString),
  remittanceInfo: asOptional(asString),
  amount: asNumber,
  currency: asOptional(
    asObject({
      name: asString
    })
  ),
  isValid: asOptional(asBoolean),
  error: asOptional(asString)
})
export type DfxBuyPaymentInfo = ReturnType<typeof asDfxBuyPaymentInfo>

// ---------------------------------------------------------------------------
// Sell payment info
// ---------------------------------------------------------------------------

export const asDfxSellPaymentInfo = asObject({
  id: asNumber,
  uid: asString,
  depositAddress: asString,
  amount: asNumber,
  isValid: asOptional(asBoolean),
  error: asOptional(asString)
})
export type DfxSellPaymentInfo = ReturnType<typeof asDfxSellPaymentInfo>

// ---------------------------------------------------------------------------
// Payment method
// ---------------------------------------------------------------------------

export const asDfxPaymentMethod = asValue('Bank')
export type DfxPaymentMethod = ReturnType<typeof asDfxPaymentMethod>
