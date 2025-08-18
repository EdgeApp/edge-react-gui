import { asObject, asString } from 'cleaners'

// Init options cleaner for infinite ramp plugin
export const asInitOptions = asObject({
  apiKey: asString,
  apiUrl: asString,
  orgId: asString
})
