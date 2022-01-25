// @flow

import { type EdgeCurrencyInfo, type EdgeDenomination } from 'edge-core-js'

import type { Dispatch, GetState, RootState } from '../types/reduxTypes.js'

export const emptyEdgeDenomination: EdgeDenomination = {
  name: '',
  multiplier: '1',
  symbol: ''
}

export const getDisplayDenominationFromState =
  (pluginId: string, currencyCode: string) =>
  (dispatch: Dispatch, getState: GetState): EdgeDenomination => {
    const state = getState()
    return getDisplayDenomination(state, pluginId, currencyCode)
  }

export const getDisplayDenomination = (state: RootState, pluginId: string, currencyCode: string): EdgeDenomination => {
  return state.ui.settings.denominationSettings[pluginId][currencyCode] ?? getExchangeDenomination(state, pluginId, currencyCode)
}

export const getExchangeDenominationFromState = (pluginId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  return getExchangeDenomination(state, pluginId, currencyCode)
}

export const getExchangeDenomination = (state: RootState, pluginId: string, currencyCode: string): EdgeDenomination => {
  const { customTokens } = state.ui.settings
  const customToken = customTokens.find(item => item.currencyCode === currencyCode)
  const { currencyInfo } = state.core.account.currencyConfig[pluginId]
  const denom = getDenominationFromCurrencyInfo(currencyInfo, currencyCode)
  return customToken?.denominations?.[0] ?? denom
}

export const getDenominationFromCurrencyInfo = (currencyInfo: EdgeCurrencyInfo, currencyCode: string): EdgeDenomination => {
  const mainDenom = currencyInfo.denominations.find(denom => denom.name === currencyCode)
  if (mainDenom != null) return mainDenom

  const metaToken = currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)
  const metaTokenDenoms = metaToken?.denominations ?? []
  const metaTokenDenom = metaTokenDenoms.find(denom => denom.name === currencyCode)
  if (metaTokenDenom != null) return metaTokenDenom
  return emptyEdgeDenomination
}
