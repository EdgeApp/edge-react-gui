import { EdgeDenomination } from 'edge-core-js'

import { getExchangeDenomByCurrencyCode } from '../selectors/DenominationSelectors'
import { useSelector } from '../types/reactRedux'

/**
 * Subscribes to a wallet's display denomination.
 */
export function useDisplayDenom(pluginId: string, currencyCode: string): EdgeDenomination {
  const account = useSelector(state => state.core.account)
  const exchangeDenomination = getExchangeDenomByCurrencyCode(account.currencyConfig[pluginId], currencyCode)
  return useSelector(state => {
    const { denominationSettings = {} } = state.ui.settings
    const pluginSettings = denominationSettings[pluginId] ?? {}
    return pluginSettings[currencyCode] ?? exchangeDenomination
  })
}
