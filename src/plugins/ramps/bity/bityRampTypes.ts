import { asObject, asOptional, asString } from 'cleaners'

export const asInitOptions = asObject({
  clientId: asOptional(asString),
  apiUrl: asOptional(asString, 'https://exchange.api.bity.com')
})
