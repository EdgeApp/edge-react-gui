import { asArray, asCodec, asNumber, uncleaner } from 'cleaners'

// XOR mask applied to each char code. Not a secret.
const MASK = 0x5a

/**
 * Decodes a string stored as an array of XOR-masked char codes,
 * e.g. "hi" <-> [0x32, 0x33]. Use `wasObfuscatedString` or
 * scripts/obfuscateString.ts to generate the array.
 */
export const asObfuscatedString = asCodec<string>(
  raw =>
    asArray(asNumber)(raw)
      .map(code => String.fromCharCode(code ^ MASK))
      .join(''),
  clean => clean.split('').map(ch => ch.charCodeAt(0) ^ MASK)
)

export const wasObfuscatedString = uncleaner(asObfuscatedString)
