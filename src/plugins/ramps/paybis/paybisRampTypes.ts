import { asObject, asOptional, asString } from 'cleaners'

export const asInitOptions = asObject({
  partnerUrl: asOptional(asString, 'https://widget-api.paybis.com'),
  apiKey: asString,
  privateKeyB64: asString,
  widgetUrl: asOptional(asString, 'https://widget.paybis.com'),
  widgetTestnetUrl: asOptional(asString, 'https://widget.sandbox.paybis.com')
})
