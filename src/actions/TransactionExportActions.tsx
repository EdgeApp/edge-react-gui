import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import { fillTxsFiat } from '../util/fillTxsFiat'

// No re-exports of the Node-safe exporters. This module is a Redux thunk,
// so re-exporting them made it a second public door to code that exists
// precisely so it can load without react-native — and two of the five had
// no consumer at all. Callers import from `util/txExport` directly, which
// is what `CategoriesActions.ts` says about its own extraction and what the
// CLI and the jest suite already did.

export function updateTxsFiat(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
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
