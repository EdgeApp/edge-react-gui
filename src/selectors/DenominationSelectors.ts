import { EdgeAccount, EdgeCurrencyInfo, EdgeDenomination, EdgeTokenMap } from 'edge-core-js'

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
const getExchangeDenominationInner = (allTokens: EdgeTokenMap, currencyInfo: EdgeCurrencyInfo, currencyCode: string): EdgeDenomination => {
  if (currencyInfo.currencyCode === currencyCode) return currencyInfo.denominations[0]
  for (const tokenId of Object.keys(allTokens)) {
    const token = allTokens[tokenId]
    if (token.currencyCode === currencyCode) return token.denominations[0]
  }

  return { ...emptyEdgeDenomination }
}
export const getExchangeDenominationFromAccount = (account: EdgeAccount, pluginId: string, currencyCode: string): EdgeDenomination => {
  const { allTokens, currencyInfo } = account.currencyConfig[pluginId]
  return getExchangeDenominationInner(allTokens, currencyInfo, currencyCode)
}
export const getExchangeDenomination = (state: RootState, pluginId: string, currencyCode: string): EdgeDenomination => {
  const { allTokens, currencyInfo } = state.core.account.currencyConfig[pluginId]
  return getExchangeDenominationInner(allTokens, currencyInfo, currencyCode)
}

/**
 * @deprecated Use `getExchangeDenomination` instead.
 * This is buggy, since it does not include custom tokens.
 */
export const getDenominationFromCurrencyInfo = (currencyInfo: EdgeCurrencyInfo, currencyCode: string): EdgeDenomination => {
  const mainDenom = currencyInfo.denominations.find(denom => denom.name === currencyCode)
  if (mainDenom != null) return mainDenom

  const metaToken = currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)
  const metaTokenDenoms = metaToken?.denominations ?? []
  const metaTokenDenom = metaTokenDenoms.find(denom => denom.name === currencyCode)
  if (metaTokenDenom != null) return metaTokenDenom
  return emptyEdgeDenomination
}
