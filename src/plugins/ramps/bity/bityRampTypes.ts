import { asObject, asOptional, asString } from 'cleaners'

export const asInitOptions = asObject({
  clientId: asOptional(asString)
})
