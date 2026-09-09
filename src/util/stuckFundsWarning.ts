import { add, gt, sub } from 'biggystring'
import type { EdgeBalanceMap, EdgeTxAmount } from 'edge-core-js'

import { zeroString } from './utils'

/**
 * Which flavor of stuck-funds warning applies to a pending transaction:
 *
 * - `tokens-remain`: the wallet already holds tokens that will be unmovable.
 * - `swap-into-token`: the wallet holds no tokens yet, but this swap puts one
 *   there while draining the gas needed to move it back out.
 */
export type StuckFundsWarning = 'tokens-remain' | 'swap-into-token'

export interface StuckFundsWarningParams {
  /** Balances of the wallet the funds leave from. */
  balanceMap: EdgeBalanceMap

  /** Network fee this transaction pays in the gas asset, in native units. */
  gasFeeNativeAmount: string

  /** Gas asset this transaction pays back into the same wallet, in native
   * units. Non-zero only for a swap whose payout is the gas asset itself. */
  gasReceivedNativeAmount?: string

  /** Gas asset this transaction spends as an amount, in native units. */
  gasSpentNativeAmount: string

  /** Token this transaction spends out of the wallet, if any. Its amount is
   * discounted from the balance that decides whether tokens stay behind. */
  spentTokenAmount?: EdgeTxAmount

  /** True when this is a swap whose payout is a token on the same wallet. */
  receivesTokenInSameWallet?: boolean
}

/**
 * Decides whether a pending transaction leaves the source wallet without
 * enough gas to move what stays behind. The threshold is the transaction's own
 * fee: a wallet that cannot afford one more transaction of the same size is
 * treated as fully drained.
 */
export function getStuckFundsWarning(
  params: StuckFundsWarningParams
): StuckFundsWarning | undefined {
  const {
    balanceMap,
    gasFeeNativeAmount,
    gasReceivedNativeAmount = '0',
    gasSpentNativeAmount,
    receivesTokenInSameWallet = false,
    spentTokenAmount
  } = params

  // A wallet that pays no gas cannot strand anything for want of gas:
  if (zeroString(gasFeeNativeAmount)) return

  const gasBalance = balanceMap.get(null) ?? '0'
  const remainingGas = add(
    sub(sub(gasBalance, gasSpentNativeAmount), gasFeeNativeAmount),
    gasReceivedNativeAmount
  )
  if (gt(remainingGas, gasFeeNativeAmount)) return

  for (const [tokenId, nativeAmount] of balanceMap) {
    if (tokenId === null) continue
    const remaining =
      tokenId === spentTokenAmount?.tokenId
        ? sub(nativeAmount, spentTokenAmount.nativeAmount)
        : nativeAmount
    if (gt(remaining, '0')) return 'tokens-remain'
  }

  if (receivesTokenInSameWallet) return 'swap-into-token'
}

/** Totals the portion of a transaction's network fees paid in the gas asset. */
export function getGasFeeNativeAmount(networkFees: EdgeTxAmount[]): string {
  return networkFees.reduce(
    (prev, fee) => (fee.tokenId == null ? add(prev, fee.nativeAmount) : prev),
    '0'
  )
}
