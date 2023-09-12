import { asCodec, asString } from 'cleaners'
import { base16 } from 'rfc4648'

/**
 * Allows the 0x prefix.
 */
export const asHex = asCodec<Uint8Array>(
  raw => base16.parse(asString(raw).replace(/^0x/, '')),
  clean => base16.stringify(clean).toLowerCase()
)

/**
 * Does not allow the 0x prefix.
 */
export const asBase16 = asCodec<Uint8Array>(
  raw => base16.parse(asString(raw)),
  clean => base16.stringify(clean).toLowerCase()
)
