import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import type { RootState } from '../types/reduxTypes'
import { emptyEdgeDenomination, getExchangeDenom } from '../util/exchangeDenom'

export { emptyEdgeDenomination, getExchangeDenom } from '../util/exchangeDenom'

export const selectDisplayDenom = (
  state: RootState,
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination => {
  const exchangeDenomination = getExchangeDenom(currencyConfig, tokenId)

  let { currencyCode } = currencyConfig.currencyInfo
  if (tokenId != null) {
    const token = currencyConfig.allTokens[tokenId]
    if (token == null) return exchangeDenomination
    currencyCode = token.currencyCode
  }

  const { pluginId } = currencyConfig.currencyInfo
  const pluginSettings = state.ui.settings.denominationSettings[pluginId]
  if (pluginSettings?.[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }
  return exchangeDenomination
}
