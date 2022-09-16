import { asCodec, asString, uncleaner } from 'cleaners'
import { base64 } from 'rfc4648'

export const asBase64 = asCodec(
  raw => base64.parse(asString(raw)),
  clean => base64.stringify(clean)
)

export const wasBase64 = uncleaner(asBase64)
