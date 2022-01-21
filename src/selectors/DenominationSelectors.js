// @flow

import type { EdgeCurrencyInfo, EdgeDenomination } from 'edge-core-js'

import { type SettingsState } from '../reducers/scenes/SettingsReducer.js'
import { type RootState } from '../types/reduxTypes.js'
import { type GuiDenomination } from '../types/types.js'

export const emptyEdgeDenomination: EdgeDenomination = {
  name: '',
  multiplier: '1',
  symbol: ''
}

export const getDisplayDenomination = (
  settings: SettingsState,
  currencyInfo: EdgeCurrencyInfo,
  currencyCode?: string = currencyInfo.currencyCode
): EdgeDenomination => {
  return settings.denominationSettings[currencyInfo.pluginId][currencyCode] ?? getDefaultDenomination(currencyInfo, currencyCode)
}

export const getDefaultDenomination = (currencyInfo: EdgeCurrencyInfo, currencyCode: string): EdgeDenomination => {
  if (currencyCode === currencyInfo.currencyCode) {
    return currencyInfo.denominations.find(denom => denom.name === currencyCode) ?? emptyEdgeDenomination
  } else if (currencyInfo.metaTokens.some(token => token.currencyCode === currencyCode)) {
    const metaToken = currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)
    if (metaToken != null) {
      return metaToken.denominations.find(denom => denom.name === currencyCode) ?? emptyEdgeDenomination
    }
  }
  return emptyEdgeDenomination
}

export const getPrimaryExchangeDenomination = (state: RootState, currencyCode: string, walletId?: string): GuiDenomination => {
  const { customTokens } = state.ui.settings
  const { currencyWallets } = state.core.account
  const wallet = currencyWallets[walletId ?? state.ui.wallets.selectedWalletId]
  const mainDenom = wallet.currencyInfo.denominations.find(denom => denom.name === currencyCode)
  if (mainDenom != null) return mainDenom

  const metaToken = wallet.currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)
  const metaTokenDenoms = metaToken?.denominations ?? []
  const metaTokenDenom = metaTokenDenoms.find(denom => denom.name === currencyCode)
  if (metaTokenDenom != null) return metaTokenDenom

  const customToken = customTokens.find(item => item.currencyCode === currencyCode)
  if (customToken && customToken.denomination && customToken.denomination[0]) {
    const denomination = customToken.denominations[0]
    return denomination
  }

  throw new Error('Edge: Denomination not found. Possible invalid currencyCode.')
}
