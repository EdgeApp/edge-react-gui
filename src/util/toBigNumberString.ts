import { mul } from 'biggystring'

const expoRegex = /e(?:\+|-)(\d+)$/

export function toBigNumberString(n: number | string): string {
  let out = typeof n === 'number' ? n.toString() : n
  // Handle scientific notation
  const match = out.match(expoRegex)

  if (match != null) {
    const exponent = parseInt(match[1])
    const base = out.replace(expoRegex, '')
    out = exp(base, exponent)
  }

  return out
}

function exp(x1: string, exponent: number): string {
  const magnitude = '1' + '0'.repeat(exponent)
  return mul(x1, magnitude)
}
