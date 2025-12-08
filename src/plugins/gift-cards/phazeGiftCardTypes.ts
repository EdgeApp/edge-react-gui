import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'

// ---------------------------------------------------------------------------
// Init / Auth
// ---------------------------------------------------------------------------

export const asPhazeInitOptions = asObject({
  baseUrl: asOptional(asString, 'https://api.rewardsevolved.com/sandbox'),
  apiKey: asString,
  /**
   * User API key returned by Register User. Optional on first-run when the user
   * is not yet registered.
   * TODO: Make this required once the partner guarantees the key will exist on
   * every request. Currently, this only shows on first-run when the user is not
   * yet registered.
   */
  userApiKey: asOptional(asString)
})
export type PhazeInitOptions = ReturnType<typeof asPhazeInitOptions>

// ---------------------------------------------------------------------------
// /crypto/tokens
// ---------------------------------------------------------------------------

export const asPhazeToken = asObject({
  symbol: asString,
  name: asString,
  chainId: asNumber,
  networkType: asString,
  address: asString,
  type: asString,
  caip19: asString
})
export type PhazeToken = ReturnType<typeof asPhazeToken>

export const asPhazeTokensResponse = asObject({
  tokens: asArray(asPhazeToken)
})
export type PhazeTokensResponse = ReturnType<typeof asPhazeTokensResponse>

// Country list (simple array of country names)
export const asPhazeCountryList = asArray(asString)
export type PhazeCountryList = ReturnType<typeof asPhazeCountryList>

// Plugin account-synced identity storage
export const PHAZE_IDENTITY_DISKLET_NAME = 'phazeGiftCardIdentity1.json'

// ---------------------------------------------------------------------------
// /crypto/user (Register User)
// ---------------------------------------------------------------------------

/**
 * Request body for POST /crypto/user
 */
export interface PhazeRegisterUserRequest {
  email: string
  firstName: string
  lastName: string
}

export const asPhazeUser = asObject({
  id: asOptional(asNumber),
  email: asString,
  firstName: asString,
  lastName: asString,
  userApiKey: asOptional(asString),
  balance: asOptional(asString), // API returns "0.00" as string
  balanceCurrency: asOptional(asString)
})
export type PhazeUser = ReturnType<typeof asPhazeUser>

export const asPhazeRegisterUserResponse = asObject({
  data: asPhazeUser
})
export type PhazeRegisterUserResponse = ReturnType<
  typeof asPhazeRegisterUserResponse
>

// ---------------------------------------------------------------------------
// /gift-cards/:country
// ---------------------------------------------------------------------------

// valueRestrictions can be empty {} for fixed-denomination cards
export const asPhazeValueRestrictions = asObject({
  maxVal: asOptional(asNumber),
  minVal: asOptional(asNumber)
})
export type PhazeValueRestrictions = ReturnType<typeof asPhazeValueRestrictions>

export const asPhazeGiftCardBrand = asObject({
  brandName: asString,
  countryName: asString,
  currency: asString,
  denominations: asArray(asNumber), // Empty when valueRestrictions has min/max
  valueRestrictions: asPhazeValueRestrictions,
  productId: asNumber,
  productImage: asString,
  productDescription: asString, // HTML
  termsAndConditions: asString, // HTML
  howToUse: asString, // HTML
  expiryAndValidity: asString,
  categories: asArray(asString),
  discount: asNumber,
  deliveryFeeInPercentage: asNumber,
  deliveryFlatFee: asOptional(asNumber),
  deliveryFlatFeeCurrency: asOptional(asString)
})
export type PhazeGiftCardBrand = ReturnType<typeof asPhazeGiftCardBrand>

export const asPhazeGiftCardsResponse = asObject({
  country: asString,
  countryCode: asString,
  brands: asArray(asPhazeGiftCardBrand),
  currentPage: asNumber,
  totalCount: asNumber
})
export type PhazeGiftCardsResponse = ReturnType<typeof asPhazeGiftCardsResponse>

// ---------------------------------------------------------------------------
// /crypto/order (Create Quote/Order)
// ---------------------------------------------------------------------------

/**
 * Cart item used in POST /crypto/order
 */
export interface PhazeCartItemRequest {
  /** Generated client-side with uuidv4 */
  orderId: string
  /** Amount to purchase in fiat (TODO: USD? Or is it in the currency of the
   * gift card?) */
  price: number
  /** Partner product ID from gift card listing */
  productId: number
}

/**
 * Request body for POST /crypto/order
 */
export interface PhazeCreateOrderRequest {
  /** Use CAIP-19 identifier from /crypto/tokens */
  tokenIdentifier: string
  cart: PhazeCartItemRequest[]
}

export const asPhazeCartItem = asObject({
  orderId: asString,
  productId: asString,
  productPrice: asNumber,
  deliveryState: asString
})
export type PhazeCartItem = ReturnType<typeof asPhazeCartItem>

export const asPhazeCreateOrderResponse = asObject({
  externalUserId: asString,
  quoteId: asString,
  status: asString,
  deliveryAddress: asString,
  tokenIdentifier: asString,
  quantity: asNumber,
  amountInUSD: asNumber,
  quoteExpiry: asNumber,
  receivedQuantity: asNumber,
  cart: asArray(asPhazeCartItem)
})
export type PhazeCreateOrderResponse = ReturnType<
  typeof asPhazeCreateOrderResponse
>

// ---------------------------------------------------------------------------
// /crypto/orders/status (Order Status)
// ---------------------------------------------------------------------------

export const asPhazeOrderStatus = asObject({
  externalUserId: asString,
  quoteId: asString,
  status: asString,
  deliveryAddress: asString,
  tokenIdentifier: asString,
  quantity: asNumber,
  amountInUSD: asNumber,
  quoteExpiry: asNumber,
  receivedQuantity: asNumber,
  cart: asArray(asPhazeCartItem)
})
export type PhazeOrderStatus = ReturnType<typeof asPhazeOrderStatus>

export const asPhazeOrderStatusResponse = asObject({
  data: asArray(asPhazeOrderStatus),
  totalCount: asNumber
})
export type PhazeOrderStatusResponse = ReturnType<
  typeof asPhazeOrderStatusResponse
>

// ---------------------------------------------------------------------------
// Common error envelope (observed)
// ---------------------------------------------------------------------------

export const asPhazeError = asObject({
  error: asString,
  httpStatusCode: asOptional(asNumber)
})
export type PhazeError = ReturnType<typeof asPhazeError>

// Misc helpers for request headers we commonly send
export const asPhazeHeaders = asObject({
  apiKey: asString,
  userApiKey: asOptional(asString), // See TODO in asPhazeInitOptions
  publicKey: asOptional(asString),
  signature: asOptional(asString),
  acceptJson: asOptional(asBoolean, true)
})
export type PhazeHeaders = ReturnType<typeof asPhazeHeaders>
