import { asArray, asJSON, asObject, asOptional, asString } from 'cleaners'

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
