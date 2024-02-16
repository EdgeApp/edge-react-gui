import { EdgeCurrencyConfig, EdgeDenomination } from 'edge-core-js'

import { RootState, ThunkAction } from '../types/reduxTypes'

export const emptyEdgeDenomination: EdgeDenomination = {
  name: '',
  multiplier: '1',
  symbol: ''
}

export function getDisplayDenominationFromState(pluginId: string, currencyCode: string): ThunkAction<EdgeDenomination> {
  return (dispatch, getState) => {
    const state = getState()
    return getDisplayDenomination(state, pluginId, currencyCode)
  }
}

export const getDisplayDenomination = (state: RootState, pluginId: string, currencyCode: string): EdgeDenomination => {
  const pluginSettings = state.ui.settings.denominationSettings[pluginId]
  if (pluginSettings != null && pluginSettings[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }
  return getExchangeDenomByCurrencyCode(state.core.account.currencyConfig[pluginId], currencyCode)
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

  return { ...emptyEdgeDenomination }
}
