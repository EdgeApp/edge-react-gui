import type { ZcashIo } from './src/zcash/zcashIo'

export function makeZcashIo(opts: {
  documentDirectory: string
}): ZcashIo
