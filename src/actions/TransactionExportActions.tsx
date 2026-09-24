import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import { fillTxsFiat } from '../util/fillTxsFiat'

export {
  exportTransactionsToBitwave,
  exportTransactionsToCSV,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO,
  getTransferTx
} from '../util/txExport'

export function updateTxsFiat(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  currencyCode: string,
  txs: EdgeTransaction[]
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const defaultIsoFiat = getState().ui.settings.defaultIsoFiat
    await fillTxsFiat({
      wallet,
      tokenId,
      isoFiat: defaultIsoFiat,
      txs
    })
  }
}
