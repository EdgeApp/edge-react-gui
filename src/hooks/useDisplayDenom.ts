import { EdgeDenomination } from 'edge-core-js'

import { DenominationSettings } from '../modules/Core/Account/settings'
import { RootState } from '../reducers/RootReducer'
import { emptyEdgeDenomination, getExchangeDenomination } from '../selectors/DenominationSelectors'
import { useSelector } from '../types/reactRedux'

/**
 * Subscribes to a wallet's display denom.
 */
export function useDisplayDenom(pluginId: string, currencyCode: string): EdgeDenomination {
  const state = useSelector<RootState>(state => state)
  const denominationSettings = useSelector<DenominationSettings>(state => state.ui.settings.denominationSettings)
  const pluginSettings = denominationSettings[pluginId]
  if (pluginSettings != null && pluginSettings[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }

  // We don't really need to "watch" exchange denoms since they never change
  return getExchangeDenomination(state, pluginId, currencyCode)
}
