import { Buffer } from 'buffer'
import { asCodec } from 'cleaners'

export const asHex = asCodec(
  raw => {
    const hex = raw.replace(/^0x/, '')
    const buffer = Buffer.from(hex, 'hex')
    // @ts-expect-error
    const u2 = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

    console.log(buffer, u2)

    const ui8a = Uint8Array.from(buffer)
    return ui8a
  },

  clean => Buffer.from(clean).toString('hex')
)
