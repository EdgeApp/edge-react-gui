// @flow

import { type EdgeDenomination } from 'edge-core-js'

import { type SettingsState } from '../../reducers/scenes/SettingsReducer.js'
import { type RootState } from '../../types/reduxTypes.js'

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

export const getDenominations = (state: RootState, currencyCode: string): EdgeDenomination[] => {
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

export const getDefaultFiat = (state: RootState) => {
  const defaultIsoFiat: string = state.ui.settings.defaultIsoFiat
  return defaultIsoFiat.replace('iso:', '')
}
