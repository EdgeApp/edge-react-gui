import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import type { RootState } from '../types/reduxTypes'

export const emptyEdgeDenomination: EdgeDenomination = Object.freeze({
  name: '',
  multiplier: '1',
  symbol: ''
})

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

/**
 * Looks up the denomination for a tokenId.
 * Pass either `account.currencyConfig[pluginId]` or `wallet.currencyConfig`,
 * whichever you have.
 */
export function getExchangeDenom(
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination {
  if (tokenId == null) return currencyConfig.currencyInfo.denominations[0]

  const token = currencyConfig.allTokens[tokenId]
  if (token != null) return token.denominations[0]

  return emptyEdgeDenomination
}
