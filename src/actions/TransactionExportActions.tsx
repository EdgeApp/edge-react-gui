import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import type { ThunkAction } from '../types/reduxTypes'
import type { FillTxsFiatResult } from '../util/fillTxsFiat'
import { fillTxsFiat } from '../util/fillTxsFiat'

// No re-exports of the Node-safe exporters. This module is a Redux thunk,
// so re-exporting them made it a second public door to code that exists
// precisely so it can load without react-native — and two of the five had
// no consumer at all. Callers import from `util/txExport` directly, which
// is what `CategoriesActions.ts` says about its own extraction and what the
// CLI and the jest suite already did.

/**
 * Price the transactions that carry no fiat amount.
 *
 * Returns `fillTxsFiat`'s result rather than discarding it: `unavailable`
 * counts the rates the queue never got an answer about, and an accounting
 * export has to refuse on it instead of writing a `0` fiat column for an
 * arbitrary tail of the oldest transactions. The CLI's `get-transactions
 * --export-format` already refuses with `RATES_INCOMPLETE`; the scene can
 * only do the same if the count reaches it.
 */
export function updateTxsFiat(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  txs: EdgeTransaction[]
): ThunkAction<Promise<FillTxsFiatResult>> {
  return async (dispatch, getState) => {
    const defaultIsoFiat = getState().ui.settings.defaultIsoFiat
    return await fillTxsFiat({
      wallet,
      tokenId,
      isoFiat: defaultIsoFiat,
      txs
    })
  }
}
