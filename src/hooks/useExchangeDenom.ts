import { EdgeDenomination } from 'edge-core-js'

import { RootState } from '../reducers/RootReducer'
import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { useSelector } from '../types/reactRedux'

/**
 * Subscribes to a wallet's exchange denomination.
 */
export function useExchangeDenom(pluginId: string, currencyCode: string): EdgeDenomination {
  const state = useSelector<RootState>(state => state)

  // We don't really need to "watch" exchange denoms since they never change
  return getExchangeDenomination(state, pluginId, currencyCode)
}
