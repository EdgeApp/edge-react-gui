import { asObject, asOptional, asString } from 'cleaners'

// Init options cleaner for btcdirect ramp plugin
export const asInitOptions = asObject({
  username: asString,
  password: asString,
  apiUrl: asOptional(asString, 'https://api.btcdirect.eu')
})

export type InitOptions = ReturnType<typeof asInitOptions>
