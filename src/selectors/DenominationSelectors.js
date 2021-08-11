// @flow

import { type EdgeDenomination } from 'edge-core-js'

import { type SettingsState } from '../reducers/scenes/SettingsReducer.js'
import { type RootState } from '../types/reduxTypes.js'
import { type GuiDenomination, type GuiWallet } from '../types/types.js'
import { getCurrencyInfo } from '../util/utils.js'

const isoFiatDenominations = {
  'iso:USD': {
    multiplier: '100',
    denominations: [
      {
        name: 'USD',
        symbol: '$',
        multiplier: '100',
        precision: 2
      }
    ]
  }
}

export const emptyEdgeDenomination: EdgeDenomination = {
  name: '',
  multiplier: '1',
  symbol: ''
}

const getDenominations = (state: RootState, currencyCode: string): EdgeDenomination[] => {
  const currencySettings = state.ui.settings[currencyCode] || isoFiatDenominations[currencyCode]
  if (currencySettings == null || currencySettings.denominations == null) {
    return [emptyEdgeDenomination]
  }
  return currencySettings.denominations
}

export const getDisplayDenominationKey = (state: RootState, currencyCode: string) => {
  const currencySettings = state.ui.settings[currencyCode]
  return currencySettings ? currencySettings.denomination : '1'
}

export const getDisplayDenominationFromSettings = (settings: SettingsState, currencyCode: string): EdgeDenomination => {
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  const denominations = currencySettings.denominations
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getDisplayDenominationFull = (state: RootState, currencyCode: string): EdgeDenomination => {
  const settings = state.ui.settings
  const currencySettings = settings[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  const denominations = currencySettings.denominations
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getDisplayDenomination = (state: RootState, currencyCode: string): EdgeDenomination => {
  const selectedDenominationKey = getDisplayDenominationKey(state, currencyCode)
  const denominations = getDenominations(state, currencyCode)
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getExchangeDenomination = (state: RootState, currencyCode: string) => {
  const denominations = getDenominations(state, currencyCode)
  let exchangeDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.name === currencyCode) {
      exchangeDenomination = d
    }
  }
  return exchangeDenomination
}

export const getDefaultDenomination = (state: RootState, currencyCode: string): EdgeDenomination => {
  const { allCurrencyInfos } = state.ui.settings.plugins
  const currencyInfo = getCurrencyInfo(allCurrencyInfos, currencyCode)
  if (currencyInfo) return currencyInfo[0]
  const settings = state.ui.settings
  const currencySettings = settings[currencyCode]
  const defaultMultiplier = currencySettings.denomination
  const denomination = currencySettings.denominations.find(denom => denom.multiplier === defaultMultiplier)
  if (!denomination) throw new Error('Edge: Denomination not found. Possible invalid currencyCode.')
  return denomination
}

export const getPrimaryExchangeDenomination = (state: RootState, currencyCode: string, specificWallet?: GuiWallet): GuiDenomination => {
  const { customTokens } = state.ui.settings
  const walletId = specificWallet ? specificWallet.id : state.ui.wallets.selectedWalletId
  const wallet = state.ui.wallets.byId[walletId]
  if (wallet.allDenominations[currencyCode]) {
    for (const key of Object.keys(wallet.allDenominations[currencyCode])) {
      const denomination = wallet.allDenominations[currencyCode][key]
      if (denomination.name === currencyCode) return denomination
    }
  } else {
    const customToken = customTokens.find(item => item.currencyCode === currencyCode)
    if (customToken && customToken.denomination && customToken.denomination[0]) {
      const denomination = customToken.denominations[0]
      return denomination
    }
  }
  throw new Error('Edge: Denomination not found. Possible invalid currencyCode.')
}
