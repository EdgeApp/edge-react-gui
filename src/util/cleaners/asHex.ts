import { Buffer } from 'buffer'
import { asCodec } from 'cleaners'

export const asHex = asCodec(
  raw => {
    const hex = raw.replace(/^0x/, '')
    const buffer = Buffer.from(hex, 'hex')

    const ui8a = Uint8Array.from(buffer)
    return ui8a
  },

  clean => Buffer.from(clean).toString('hex')
)
