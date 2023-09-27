import { EdgeAccount, EdgeDenomination } from 'edge-core-js'

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
  return getExchangeDenomination(state, pluginId, currencyCode)
}

export function getExchangeDenominationFromState(pluginId: string, currencyCode: string): ThunkAction<EdgeDenomination> {
  return (dispatch, getState) => {
    const state = getState()
    return getExchangeDenomination(state, pluginId, currencyCode)
  }
}

/**
 * Finds the primary denomination for the given currencyCode.
 * This would match "BTC" but not "sats".
 */
export const getExchangeDenomination = (state: RootState, pluginId: string, currencyCode: string): EdgeDenomination => {
  return getExchangeDenominationFromAccount(state.core.account, pluginId, currencyCode)
}

/**
 * Finds the primary denomination for the given currencyCode and account
 * This would match "BTC" but not "sats".
 */
export const getExchangeDenominationFromAccount = (account: EdgeAccount, pluginId: string, currencyCode: string): EdgeDenomination => {
  const { allTokens, currencyInfo } = account.currencyConfig[pluginId]

  if (currencyInfo.currencyCode === currencyCode) return currencyInfo.denominations[0]
  for (const tokenId of Object.keys(allTokens)) {
    const token = allTokens[tokenId]
    if (token.currencyCode === currencyCode) return token.denominations[0]
  }

  return { ...emptyEdgeDenomination }
}
