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

/**
 * A gift card order, from `POST /gift-cards`, `GET /gift-cards/{id}`, and each
 * entry of `GET /gift-cards`.
 *
 * The card and the payment are one object: creating a card allocates a payment
 * address and quotes the crypto amount at `rate`, and the card is fulfilled
 * once that payment confirms. The list endpoint omits `paymentCryptoAddress`
 * and `paymentUrls`, so both are optional here.
 */
export const asCtxSpendGiftCard = asObject({
  id: asString,
  merchantId: asString,
  merchantName: asString,

  /** Face value of the card. */
  cardFiatAmount: asString,
  cardFiatCurrency: asString,

  // Payment side.
  paymentId: asOptional(asString),
  paymentMethod: asOptional(asString),
  /** Where to send the crypto. Absent from list entries. */
  paymentCryptoAddress: asOptional(asString),
  /** Decimal units of `paymentCryptoCurrency`, not native units. */
  paymentCryptoAmount: asOptional(asString),
  paymentCryptoChain: asOptional(asString),
  paymentCryptoCurrency: asOptional(asString),
  /** `mainnet` or `testnet`. Staging issues testnet addresses. */
  paymentCryptoNetwork: asOptional(asString),
  /** Payment URIs keyed by `<chain>.<asset>`. Absent from list entries. */
  paymentUrls: asOptional(asObject(asString), () => ({})),
  /** Fiat-per-crypto quote the payment amount was derived from. */
  rate: asOptional(asString),

  // Status. `status` is the headline; the other two say which half moved.
  status: asString,
  displayStatus: asOptional(asString),
  paymentStatus: asOptional(asString),
  fulfilmentStatus: asOptional(asString),

  created: asOptional(asString),
  updated: asOptional(asString)
})
export type CtxSpendGiftCard = ReturnType<typeof asCtxSpendGiftCard>

export const asCtxSpendGiftCardsResponse = asObject({
  pagination: asCtxSpendPagination,
  result: asOptional(asArray(asCtxSpendGiftCard), () => [])
})
export type CtxSpendGiftCardsResponse = ReturnType<
  typeof asCtxSpendGiftCardsResponse
>

/** Body of `POST /gift-cards`. Field names are the server's, verbatim. */
export interface CtxSpendCreateGiftCardRequest {
  merchantId: string
  /** Decimal fiat string, e.g. `'0.01'`. */
  fiatAmount: string
  fiatCurrency: string
  /**
   * Which crypto to pay with, as `CHAIN` or `CHAIN.TOKEN` (`ETH`, `ETH.USDC`).
   * Omitting it selects the fiat rail, which staging only supports for GBP.
   */
  cryptoCurrency: string
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Every non-2xx response body observed so far is `{ "error": "..." }`. */
export const asCtxSpendError = asObject({
  error: asString
})

/**
 * A rejected write additionally carries a per-field reason map, which is the
 * half that says what to change.
 */
export const asCtxSpendErrorBody = asObject({
  error: asString,
  fields: asOptional(asObject(asArray(asString)))
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
