import {
  asArray,
  asBoolean,
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'

/**
 * Cleaner that accepts either a number or a numeric string and returns a number.
 * The Phaze API inconsistently returns some fields as either type (e.g., quoteExpiry).
 */
const asNumberOrNumericString: Cleaner<number> = asEither(
  asNumber,
  (raw: unknown): number => {
    const str = asString(raw)
    const num = Number(str)
    if (isNaN(num)) {
      throw new TypeError(`Expected a numeric string, got "${str}"`)
    }
    return num
  }
)

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
  id: asNumber,
  email: asString,
  firstName: asString,
  lastName: asString,
  userApiKey: asOptional(asString),
  balance: asString, // API always returns as string, e.g. "0.00"
  balanceCurrency: asString
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

/**
 * Order status values - shared between create and status responses
 */
export const asPhazeOrderStatusValue = asEither(
  asValue('complete'),
  asValue('pending'),
  asValue('processing'),
  asValue('expired')
)
export type PhazeOrderStatusValue = ReturnType<typeof asPhazeOrderStatusValue>

export const asPhazeCreateOrderResponse = asObject({
  externalUserId: asString,
  quoteId: asString,
  status: asPhazeOrderStatusValue,
  deliveryAddress: asString,
  tokenIdentifier: asString,
  quantity: asNumber,
  amountInUSD: asNumber,
  quoteExpiry: asNumberOrNumericString,
  receivedQuantity: asNumber,
  cart: asArray(asPhazeCartItem)
})
export type PhazeCreateOrderResponse = ReturnType<
  typeof asPhazeCreateOrderResponse
>

// ---------------------------------------------------------------------------
// /crypto/orders/status (Order Status)
// ---------------------------------------------------------------------------

/**
 * Voucher code returned when order is complete
 */
export const asPhazeVoucher = asObject({
  url: asString,
  code: asString,
  validityDate: asString,
  voucherCurrency: asString,
  faceValue: asNumber
})
export type PhazeVoucher = ReturnType<typeof asPhazeVoucher>

/**
 * Cart item delivery status values
 */
export const asPhazeCartItemStatus = asEither(
  asValue('processed'),
  asValue('pending'),
  asValue('failed')
)
export type PhazeCartItemStatus = ReturnType<typeof asPhazeCartItemStatus>

/**
 * Cart item in a completed/processing order - has vouchers and delivery status
 */
export const asPhazeCompletedCartItem = asObject({
  id: asNumber,
  orderId: asString,
  productId: asString,
  productName: asString,
  status: asPhazeCartItemStatus,
  faceValue: asNumber,
  voucherCurrency: asString,
  vouchers: asArray(asPhazeVoucher),
  // Additional fields we may use
  externalUserId: asOptional(asString),
  voucherDiscountPercent: asOptional(asNumber),
  baseCurrency: asOptional(asString),
  commission: asOptional(asNumber),
  created_at: asOptional(asString),
  updated_at: asOptional(asString)
})
export type PhazeCompletedCartItem = ReturnType<typeof asPhazeCompletedCartItem>

/**
 * Order status response - used when polling for completion
 */
export const asPhazeOrderStatusItem = asObject({
  externalUserId: asString,
  quoteId: asString,
  status: asPhazeOrderStatusValue,
  deliveryAddress: asString,
  tokenIdentifier: asString,
  quantity: asNumber,
  amountInUSD: asNumber,
  quoteExpiry: asNumberOrNumericString,
  receivedQuantity: asNumber,
  cart: asArray(asPhazeCompletedCartItem)
})
export type PhazeOrderStatusItem = ReturnType<typeof asPhazeOrderStatusItem>

export const asPhazeOrderStatusResponse = asObject({
  data: asArray(asPhazeOrderStatusItem),
  totalCount: asNumber
})
export type PhazeOrderStatusResponse = ReturnType<
  typeof asPhazeOrderStatusResponse
>

// Legacy type alias for backwards compatibility
export const asPhazeOrderStatus = asPhazeOrderStatusItem
export type PhazeOrderStatus = PhazeOrderStatusItem

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

// ---------------------------------------------------------------------------
// Local Order Storage (enhanced with brand info and transaction link)
// ---------------------------------------------------------------------------

/**
 * Extended order data stored locally, including brand info for display
 * and transaction ID for linking to TransactionDetailsScene.
 */
export const asPhazeStoredOrder = asObject({
  // Core order data from API
  quoteId: asString,
  status: asPhazeOrderStatusValue,
  deliveryAddress: asString,
  tokenIdentifier: asString,
  quantity: asNumber,
  amountInUSD: asNumber,
  quoteExpiry: asNumber,
  cart: asArray(asPhazeCartItem),

  // Brand info for display
  brandName: asString,
  brandImage: asString,
  fiatAmount: asNumber,
  fiatCurrency: asString,

  // Transaction link
  walletId: asOptional(asString),
  tokenId: asOptional(asString), // null for native, string for tokens
  txid: asOptional(asString),
  createdAt: asNumber, // Unix timestamp

  // Vouchers (populated after order complete)
  vouchers: asOptional(asArray(asPhazeVoucher)),
  deliveryStatus: asOptional(asString),

  // Legacy field - use vouchers[0].code instead
  redemptionCode: asOptional(asString)
})
export type PhazeStoredOrder = ReturnType<typeof asPhazeStoredOrder>
