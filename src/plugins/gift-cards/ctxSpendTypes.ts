import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * First leg of `POST /login`: the server acknowledges the public key and hands
 * back the nonce the client must sign.
 */
export const asCtxSpendLoginNonce = asObject({
  nonce: asNumber
})
export type CtxSpendLoginNonce = ReturnType<typeof asCtxSpendLoginNonce>

/**
 * Second leg of `POST /login`, and the whole of `POST /refresh-token`.
 */
export const asCtxSpendTokens = asObject({
  accessToken: asString,
  refreshToken: asString
})
export type CtxSpendTokens = ReturnType<typeof asCtxSpendTokens>

/** Claims we read out of the JWT payload. Times are seconds since epoch. */
export const asCtxSpendJwtClaims = asObject({
  exp: asNumber
})

/** A single permission grant from `GET /me`. */
export const asCtxSpendPermission = asObject({
  action: asString,
  scope: asOptional(asString)
})
export type CtxSpendPermission = ReturnType<typeof asCtxSpendPermission>

/**
 * `GET /me`. The anonymous user is created server-side on first login, so this
 * is the first place the client learns its own user id.
 */
export const asCtxSpendAuthContext = asObject({
  user: asObject({
    id: asString,
    name: asString,
    type: asString,
    status: asString,
    companyId: asOptional(asString),
    companyName: asOptional(asString)
  }),
  company: asObject({
    id: asString,
    name: asString,
    status: asString,
    countries: asOptional(asArray(asString), () => [])
  }),
  client: asOptional(
    asObject({
      id: asString,
      name: asString,
      status: asString
    })
  ),
  permissions: asOptional(asArray(asCtxSpendPermission), () => [])
})
export type CtxSpendAuthContext = ReturnType<typeof asCtxSpendAuthContext>

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const asCtxSpendPagination = asObject({
  page: asNumber,
  pages: asNumber,
  perPage: asNumber,
  total: asNumber
})
export type CtxSpendPagination = ReturnType<typeof asCtxSpendPagination>

/**
 * A purchasable brand from `GET /merchants`. `denominationType` selects how
 * `denominations` is read: `min-max` gives a two-element [min, max] range,
 * anything else gives an explicit list of allowed values.
 */
export const asCtxSpendMerchant = asObject({
  id: asString,
  name: asString,
  slug: asString,
  country: asString,
  currency: asString,
  status: asString,
  enabled: asOptional(asBoolean, true),
  denominationType: asOptional(asString),
  denominations: asOptional(asArray(asString), () => []),
  cardImageUrl: asOptional(asString),
  logoUrl: asOptional(asString),
  redeemType: asOptional(asString),
  redeemLocation: asOptional(asString),
  /** Basis points off the face value, e.g. 400 = 4%. */
  userDiscount: asOptional(asNumber)
})
export type CtxSpendMerchant = ReturnType<typeof asCtxSpendMerchant>

export const asCtxSpendMerchantsResponse = asObject({
  pagination: asCtxSpendPagination,
  // The API sends `null` rather than `[]` for an empty page.
  result: asOptional(asArray(asCtxSpendMerchant), () => [])
})
export type CtxSpendMerchantsResponse = ReturnType<
  typeof asCtxSpendMerchantsResponse
>

/** A gift card the authenticated user owns, from `GET /gift-cards`. */
export const asCtxSpendGiftCard = asObject({
  id: asString,
  status: asString,
  amount: asOptional(asString),
  currency: asOptional(asString),
  created: asOptional(asString),
  merchantId: asOptional(asString),
  merchantName: asOptional(asString)
})
export type CtxSpendGiftCard = ReturnType<typeof asCtxSpendGiftCard>

export const asCtxSpendGiftCardsResponse = asObject({
  pagination: asCtxSpendPagination,
  result: asOptional(asArray(asCtxSpendGiftCard), () => [])
})
export type CtxSpendGiftCardsResponse = ReturnType<
  typeof asCtxSpendGiftCardsResponse
>

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Every non-2xx response body observed so far is `{ "error": "..." }`. */
export const asCtxSpendError = asObject({
  error: asString
})

// ---------------------------------------------------------------------------
// Persisted identity
// ---------------------------------------------------------------------------

/**
 * The long-lived half of a CTX identity. Only the private key is durable state:
 * tokens are re-derivable from it at any time, so they are never persisted.
 */
export const asCtxSpendStoredIdentity = asObject({
  uniqueId: asString,
  scheme: asValue('secp256k1'),
  privateKeyHex: asString,
  publicKeyHex: asString,
  createdIsoDate: asString
})
export type CtxSpendStoredIdentity = ReturnType<typeof asCtxSpendStoredIdentity>
