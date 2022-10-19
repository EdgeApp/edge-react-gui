import { add } from 'biggystring'
import { EdgeNetworkFee } from 'edge-core-js'

import { ExecutionOutput } from '../controllers/action-queue/types'

// Map: currencyCode -> nativeAmount
export interface NetworkFeeMap {
  [currencyCode: string]: EdgeNetworkFee | undefined
}
export const getExecutionNetworkFees = (executionOutputs: ExecutionOutput[]): NetworkFeeMap => {
  const networkFeeMap: NetworkFeeMap = {}

  for (const output of executionOutputs) {
    for (const tx of output.broadcastTxs) {
      const { currencyCode, nativeAmount } = tx.networkFee
      const current = networkFeeMap[currencyCode] ?? {
        currencyCode,
        nativeAmount: '0'
      }
      networkFeeMap[currencyCode] = { ...current, nativeAmount: add(current.nativeAmount, nativeAmount) }
    }
  }

  return networkFeeMap
}
