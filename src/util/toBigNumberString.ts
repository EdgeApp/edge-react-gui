import { mul } from 'biggystring'

const expoRegex = /e((?:\+|-)\d+)$/

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
  const magnitude =
    exponent > 0
      ? '1' + '0'.repeat(Math.abs(exponent)) // 5.8e7 -> 58000000
      : `0.${'0'.repeat(Math.abs(exponent) - 1)}1` // 5.8e-7 -> 0.00000058
  return mul(x1, magnitude)
}
