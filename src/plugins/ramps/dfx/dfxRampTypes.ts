import {
  asArray,
  asEither,
  asJSON,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  uncleaner
} from 'cleaners'

export interface InitOptions {
  readonly partnerIcon: string
  // Partner/wallet identifier sent to the DFX widget. Override per build so
  // white-label apps do not identify as Edge.
  readonly wallet: string
}

export const asInitOptions = asObject<InitOptions>({
  partnerIcon: asOptional(asString, `https://content.edge.app/dfx-logo.png`),
  wallet: asOptional(asString, 'Edge')
}).withRest

/**
 * A failed request's body. DFX answers errors the way NestJS does,
 * `{ statusCode, message, error }`, where `message` may be a list.
 */
export const asDfxErrorResponse = asJSON(
  asObject({
    message: asEither(asString, asArray(asString))
  })
)

/** GET /v1/auth/signMessage: the ownership message to sign. */
export const asDfxSignMessageResponse = asJSON(
  asObject({
    message: asString,
    blockchains: asArray(asString)
  })
)

/** POST /v1/auth: the session JWT for the signed address. */
export const asDfxAuthResponse = asJSON(
  asObject({
    accessToken: asString
  })
)

/** GET /v1/asset: the assets DFX trades, with the ids its quotes take. */
export const asDfxAssets = asJSON(
  asArray(
    asObject({
      id: asNumber,
      name: asString,
      blockchain: asString
    })
  )
)

/** GET /v1/fiat: the fiat currencies, with the ids its quotes take. */
export const asDfxFiats = asJSON(
  asArray(
    asObject({
      id: asNumber,
      name: asString
    })
  )
)

/** PUT /v1/sell/quote: the fiat to receive, by DFX's asset and fiat ids. */
export const asDfxSellQuoteRequest = asObject({
  asset: asObject({ id: asNumber }),
  currency: asObject({ id: asNumber }),
  targetAmount: asNumber
})

export const wasDfxSellQuoteRequest = uncleaner(asJSON(asDfxSellQuoteRequest))

/** PUT /v1/sell/quote: the crypto to sell, by DFX's asset and fiat ids. */
export const asDfxSellEstimateRequest = asObject({
  asset: asObject({ id: asNumber }),
  currency: asObject({ id: asNumber }),
  amount: asNumber
})

export const wasDfxSellEstimateRequest = uncleaner(
  asJSON(asDfxSellEstimateRequest)
)

/** PUT /v1/sell/quote: `amount` is the crypto to send for `targetAmount`. */
export const asDfxSellQuoteResponse = asJSON(
  asObject({
    amount: asNumber
  })
)

/** PUT /v1/sell/quote: `estimatedAmount` is the fiat for `amount`. */
export const asDfxSellEstimateResponse = asJSON(
  asObject({
    estimatedAmount: asNumber
  })
)

/**
 * The query of the redirect DFX's sell page opens once the user confirms a
 * sell. `amount` is the crypto to send, and `isComplete` is 'false' while
 * the crypto still has to be sent.
 */
export const asDfxSellRedirectQuery = asObject({
  routeId: asString,
  amount: asString,
  asset: asString,
  blockchain: asString,
  isComplete: asValue('true', 'false')
})

/**
 * GET /v1/sell/{id}: the sell route, with the address that takes the
 * deposit, the blockchains it takes it on, and the fiat it pays out.
 */
export const asDfxSellRoute = asJSON(
  asObject({
    deposit: asOptional(
      asObject({
        address: asString,
        blockchains: asArray(asString)
      })
    ),
    currency: asOptional(asObject({ name: asString }))
  })
)
