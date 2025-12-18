import {
  asArray,
  asBoolean,
  asDate,
  asEither,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'

import { FIAT_CODES_SYMBOLS } from '../../constants/WalletAndCurrencyConstants'

// Build regex to match trailing currency symbols and amounts from FIAT_CODES_SYMBOLS
// Exclude symbols containing ASCII letters to avoid matching word endings
// (e.g., 'm' for TMT, 'kr' for SEK/NOK could match "Amazon.com", "Flickr")
const HAS_ASCII_LETTER = /[A-Za-z]/
const CURRENCY_SYMBOLS = [...new Set(Object.values(FIAT_CODES_SYMBOLS))]
  .filter(s => s.length > 0 && !HAS_ASCII_LETTER.test(s))
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
  .join('|')
// Match patterns like " $", " $50", " $50-$2000", " €100", etc.
// Require whitespace before the symbol to avoid matching word endings
const CURRENCY_AMOUNT_SUFFIX_REGEX = new RegExp(
  `\\s+(${CURRENCY_SYMBOLS})\\d*(?:\\s*-\\s*(${CURRENCY_SYMBOLS})?\\d+)?$`
)

/**
 * Strip trailing currency symbols and amounts from brand name.
 * Handles patterns like "Amazon $", "Royal Caribbean $50-$2000", etc.
 */
export const cleanBrandName = (name: string): string =>
  name.replace(CURRENCY_AMOUNT_SUFFIX_REGEX, '').trim()

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

/**
 * Cleaner for denominations array that deduplicates values.
 * The Phaze API sometimes returns duplicate denominations.
 */
const asUniqueDenominations: Cleaner<number[]> = (raw: unknown): number[] => {
  const arr = asArray(asNumber)(raw)
  return [...new Set(arr)]
}

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
  caip19: asString,
  minimumAmount: asNumber,
  minimumAmountInUSD: asNumber
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
// TODO: Remove legacy support for PHAZE_IDENTITY_DISKLET_NAME after migration period
// DEPRECATED: Old single-identity storage - kept for migration
export const PHAZE_IDENTITY_DISKLET_NAME = 'phazeGiftCardIdentity1.json'
// New multi-identity storage pattern: phaze-identity-{uuid}.json
export const PHAZE_IDENTITY_PREFIX = 'phaze-identity-'
export const PHAZE_IDENTITY_SUFFIX = '.json'

/**
 * Get the disklet filename for a Phaze identity based on its unique ID.
 * The unique ID is the email prefix (the UUID part before @edge.app).
 */
export const getPhazeIdentityFilename = (uniqueId: string): string =>
  `${PHAZE_IDENTITY_PREFIX}${uniqueId}${PHAZE_IDENTITY_SUFFIX}`

/**
 * Extract the unique ID from a Phaze identity filename.
 * Returns undefined if the filename doesn't match the pattern.
 */
export const parsePhazeDiskletFilename = (
  filename: string
): string | undefined => {
  if (
    filename.startsWith(PHAZE_IDENTITY_PREFIX) &&
    filename.endsWith(PHAZE_IDENTITY_SUFFIX)
  ) {
    return filename.slice(
      PHAZE_IDENTITY_PREFIX.length,
      -PHAZE_IDENTITY_SUFFIX.length
    )
  }
  return undefined
}

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

/**
 * Gift card brand data from Phaze API.
 * Required fields are needed for market listing display.
 * Optional fields are only returned when fetching full brand details.
 */
export const asPhazeGiftCardBrand = asObject({
  // Required fields for market listing
  brandName: asString,
  countryName: asString,
  currency: asString,
  denominations: asUniqueDenominations, // Empty when valueRestrictions has min/max
  valueRestrictions: asPhazeValueRestrictions,
  productId: asNumber,
  productImage: asString,
  categories: asArray(asString),

  // Optional fields - only fetched for purchase scene
  productDescription: asOptional(asString), // HTML
  termsAndConditions: asOptional(asString), // HTML
  howToUse: asOptional(asString), // HTML
  expiryAndValidity: asOptional(asString),
  discount: asOptional(asNumber),
  deliveryFeeInPercentage: asOptional(asNumber),
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
 * Note: Many fields are optional to handle incomplete data from older orders
 */
export const asPhazeCompletedCartItem = asObject({
  id: asOptional(asNumber),
  orderId: asOptional(asString),
  productId: asOptional(asString),
  productName: asOptional(asString),
  status: asOptional(asPhazeCartItemStatus),
  faceValue: asOptional(asNumber),
  voucherCurrency: asOptional(asString),
  vouchers: asOptional(asArray(asPhazeVoucher)),
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
// Local Order Augments (minimal data we persist to augment Phaze API data)
// ---------------------------------------------------------------------------

/**
 * Minimal augmentation data stored per order. Phaze API drives display;
 * this only stores what Phaze doesn't know: transaction link, user-set flags,
 * and brand image (not in order status response).
 */
export const asPhazeOrderAugment = asObject({
  // Transaction link for navigation to tx details
  walletId: asOptional(asString),
  tokenId: asOptional(asString), // null for native, string for tokens
  txid: asOptional(asString),

  // Brand image URL (not returned in order status API)
  brandImage: asOptional(asString),

  // User-set timestamp when card was marked as used/archived (no API for this)
  redeemedDate: asOptional(asDate)
})
export type PhazeOrderAugment = ReturnType<typeof asPhazeOrderAugment>

/**
 * Map of orderId -> augment data. Stored as single JSON file.
 */
export const asPhazeOrderAugments = (
  raw: unknown
): Record<string, PhazeOrderAugment> => {
  if (typeof raw !== 'object' || raw == null) return {}
  const result: Record<string, PhazeOrderAugment> = {}
  for (const [key, value] of Object.entries(raw)) {
    try {
      result[key] = asPhazeOrderAugment(value)
    } catch {
      // Skip invalid entries
    }
  }
  return result
}
export type PhazeOrderAugments = ReturnType<typeof asPhazeOrderAugments>

// ---------------------------------------------------------------------------
// Display Order (Phaze API data merged with augments)
// ---------------------------------------------------------------------------

/**
 * Combined order data for display: Phaze API data + local augments.
 * This is what the UI components receive.
 */
export interface PhazeDisplayOrder {
  // From Phaze API (PhazeOrderStatusItem)
  quoteId: string
  status: PhazeOrderStatusValue
  // From Phaze API cart items
  brandName: string
  brandImage: string
  fiatAmount: number
  fiatCurrency: string
  vouchers: PhazeVoucher[]

  // From local augments
  walletId?: string
  tokenId?: string
  txid?: string
  redeemedDate?: Date
}
