import { add } from 'biggystring'

import { ZcashBalances } from './zcashTypes'

/**
 * The spendable balance reported to the GUI: every shielded pool's available
 * value. Transparent funds are excluded (they get autoshielded).
 */
export function computeAvailableZatoshi(balances: ZcashBalances): string {
  return add(
    add(balances.saplingAvailableZatoshi, balances.orchardAvailableZatoshi),
    balances.ironwoodAvailableZatoshi
  )
}
