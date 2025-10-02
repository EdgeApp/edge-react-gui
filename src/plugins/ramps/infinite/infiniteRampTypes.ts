import { asObject, asOptional, asString } from 'cleaners'

// Init options cleaner for infinite ramp plugin
export const asInitOptions = asObject({
  apiUrl: asOptional(asString, 'https://headless.infinite.dev'),
  orgId: asOptional(asString, 'xxx')
})
