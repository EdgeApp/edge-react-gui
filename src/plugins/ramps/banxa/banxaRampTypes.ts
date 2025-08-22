import { asObject, asString } from 'cleaners'

// Init options cleaner for banxa ramp plugin
export const asInitOptions = asObject({
  apiKey: asString,
  hmacUser: asString,
  partnerUrl: asString
})
