import { asObject, asString } from 'cleaners'

export const asInitOptions = asObject({
  partnerUrl: asString,
  apiKey: asString,
  privateKeyB64: asString
})
