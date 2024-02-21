import { EdgeCurrencyConfig, EdgeDenomination, EdgeTokenId } from 'edge-core-js'

import { RootState } from '../types/reduxTypes'

export const emptyEdgeDenomination: EdgeDenomination = Object.freeze({
  name: '',
  multiplier: '1',
  symbol: ''
})

export const selectDisplayDenomByCurrencyCode = (state: RootState, currencyConfig: EdgeCurrencyConfig, currencyCode: string): EdgeDenomination => {
  const { pluginId } = currencyConfig.currencyInfo
  const pluginSettings = state.ui.settings.denominationSettings[pluginId]
  if (pluginSettings != null && pluginSettings[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }
  return getExchangeDenomByCurrencyCode(currencyConfig, currencyCode)
}

export const selectDisplayDenom = (state: RootState, currencyConfig: EdgeCurrencyConfig, tokenId: EdgeTokenId): EdgeDenomination => {
  const exchangeDenomination = getExchangeDenom(currencyConfig, tokenId)

  let { currencyCode } = currencyConfig.currencyInfo
  if (tokenId != null) {
    const token = currencyConfig.allTokens[tokenId]
    if (token == null) return exchangeDenomination
    currencyCode = token.currencyCode
  }

  const { pluginId } = currencyConfig.currencyInfo
  const pluginSettings = state.ui.settings.denominationSettings[pluginId]
  if (pluginSettings != null && pluginSettings[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }
  return exchangeDenomination
}

/**
 * Finds the primary denomination for the given currencyCode.
 * This would match "BTC" but not "sats".
 * Pass either `account.currencyConfig[pluginId]` or `wallet.currencyConfig`,
 * whichever you have.
 */
export const getExchangeDenomByCurrencyCode = (currencyConfig: EdgeCurrencyConfig, currencyCode: string): EdgeDenomination => {
  const { allTokens, currencyInfo } = currencyConfig

  if (currencyInfo.currencyCode === currencyCode) return currencyInfo.denominations[0]
  for (const tokenId of Object.keys(allTokens)) {
    const token = allTokens[tokenId]
    if (token.currencyCode === currencyCode) return token.denominations[0]
  }

  return emptyEdgeDenomination
}

/**
 * Looks up the denomination for a tokenId.
 * Pass either `account.currencyConfig[pluginId]` or `wallet.currencyConfig`,
 * whichever you have.
 */
export function getExchangeDenom(currencyConfig: EdgeCurrencyConfig, tokenId: EdgeTokenId): EdgeDenomination {
  if (tokenId == null) return currencyConfig.currencyInfo.denominations[0]

  const token = currencyConfig.allTokens[tokenId]
  if (token != null) return token.denominations[0]

  return emptyEdgeDenomination
}
