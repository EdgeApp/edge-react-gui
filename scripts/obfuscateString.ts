// Generates the obfuscated char-code array to paste into keys.json for
// fields cleaned by asObfuscatedString.
//
// Usage:
//   node -r sucrase/register scripts/obfuscateString.ts <plaintext...>

import { wasObfuscatedString } from '../src/util/cleaners/asObfuscatedString'

const plaintext = process.argv.slice(2).join(' ')

if (plaintext === '') {
  console.error('Usage: obfuscateString.ts <plaintext>')
  process.exit(1)
}

console.log(JSON.stringify(wasObfuscatedString(plaintext)))
