import { EdgeCurrencyConfig, EdgeDenomination, EdgeTokenId } from 'edge-core-js'

import { selectDisplayDenom } from '../selectors/DenominationSelectors'
import { useSelector } from '../types/reactRedux'

/**
 * Subscribes to a wallet's display denomination.
 */
export function useDisplayDenom(currencyConfig: EdgeCurrencyConfig, tokenId: EdgeTokenId): EdgeDenomination {
  return useSelector(state => selectDisplayDenom(state, currencyConfig, tokenId))
}
