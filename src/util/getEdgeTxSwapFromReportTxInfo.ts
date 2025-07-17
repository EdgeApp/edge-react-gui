import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'

import { getCurrencyCode } from './CurrencyInfoHelpers'
import { ReportsTxInfo } from './reportsServer'

export const getEdgeTxSwapFromReportTxInfo = (
  wallet: EdgeCurrencyWallet,
  transaction: EdgeTransaction,
  txInfo: ReportsTxInfo
): EdgeTxSwap | null => {
  const payoutCurrencyCode = getCurrencyCode(wallet, transaction.tokenId)

  const swapData: EdgeTxSwap = {
    orderId: txInfo.orderId,
    isEstimate: false,

    // The EdgeSwapInfo from the swap plugin:
    plugin: {
      pluginId: txInfo.providerId,
      displayName: txInfo.providerId,
      supportEmail: undefined
    },

    // Address information:
    payoutAddress: txInfo.destinationAddress ?? '',
    payoutCurrencyCode,
    payoutNativeAmount: txInfo.destinationAmount.toString(),
    payoutWalletId: transaction.walletId
  }
  return swapData
}
