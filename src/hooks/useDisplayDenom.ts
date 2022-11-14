import { EdgeDenomination } from 'edge-core-js'

import { useSelector } from '../types/reactRedux'
import { useExchangeDenom } from './useExchangeDenom'

/**
 * Subscribes to a wallet's display denomination.
 */
export function useDisplayDenom(pluginId: string, currencyCode: string): EdgeDenomination {
  const exchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  return useSelector(state => {
    const { denominationSettings = {} } = state.ui.settings
    const pluginSettings = denominationSettings[pluginId] ?? {}
    return pluginSettings[currencyCode] ?? exchangeDenomination
  })
}
