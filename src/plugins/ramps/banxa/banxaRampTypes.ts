import { asObject, asOptional, asString } from 'cleaners'

// Init options cleaner for banxa ramp plugin
export const asInitOptions = asObject({
  apiKey: asString,
  hmacUser: asString,
  apiUrl: asOptional(asString, 'https://edge3.banxa.com')
})
