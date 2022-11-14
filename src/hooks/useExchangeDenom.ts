import { EdgeDenomination } from 'edge-core-js'

import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { useSelector } from '../types/reactRedux'

/**
 * Subscribes to a wallet's exchange denomination.
 */
export function useExchangeDenom(pluginId: string, currencyCode: string): EdgeDenomination {
  return useSelector(state => getExchangeDenomination(state, pluginId, currencyCode))
}
