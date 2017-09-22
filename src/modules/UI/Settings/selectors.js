// @flow
import isoFiatDenominations from './IsoFiatDenominations.js'

export const getSettings = (state: any) => {
  const settings = state.ui.settings
  return settings
}

export const getLoginStatus = (state: any) => {
  const settings = getSettings(state)
  const loginStatus = settings.loginStatus
  return loginStatus
}

export const getExchangeTimer = (state: any) => {
  const settings = getSettings(state)
  const exchangeTimer = settings.exchangeTimer
  return exchangeTimer
}

export const getCurrencySettings = (state: any, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  return currencySettings
}

export const getDenominations = (state: any, currencyCode: string) => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  const denominations = currencySettings.denominations
  return denominations
}

export const getDisplayDenominationKey = (state: any, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  return selectedDenominationKey
}

export const getDisplayDenominationFromSettings = (settings: any, currencyCode: string) => {
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  const denominations = currencySettings.denominations
  const selectedDenomination = denominations.find((denomination) => denomination.multiplier === selectedDenominationKey)
  return selectedDenomination
}

export const getDisplayDenomination = (state: any, currencyCode: string) => {
  const selectedDenominationKey = getDisplayDenominationKey(state, currencyCode)
  const denominations = getDenominations(state, currencyCode)
  const selectedDenomination = denominations.find((denomination) => denomination.multiplier === selectedDenominationKey)
  return selectedDenomination
}

export const getExchangeDenomination = (state: any, currencyCode: string) => {
  const denominations = getDenominations(state, currencyCode)
  const exchangeDenomination = denominations.find((denomination) => denomination.name === currencyCode)
  return exchangeDenomination
}

export const getPlugins = (state: any) => {
  const settings = getSettings(state)
  const plugins = settings.plugins
  return plugins
}

export const getPlugin = (state: any, type: string) => {
  const plugins = getPlugins(state)
  const plugin = plugins[type]
  return plugin
}

export const getBitcoinPlugin = (state: any) => {
  const bitcoinPlugin = getPlugin(state, 'bitcoin')
  return bitcoinPlugin
}

export const getEthereumPlugin = (state: any) => {
  const ethereumPlugin = getPlugin(state, 'ethereum')
  return ethereumPlugin
}

export const getSupportedWalletTypes = (state: any) => {
  const plugins = getPlugins(state).arrayPlugins
  const supportedWalletTypes = plugins.reduce((walletTypes, plugin) =>
    [
      ...walletTypes,
      {
        label: plugin.currencyInfo.currencyName,
        value: plugin.currencyInfo.walletTypes[0]
      }
    ], [])
  return supportedWalletTypes
}

export const getAutoLogoutTimeInSeconds = (state: any) => {
  const settings = getSettings(state)
  const autoLogoutTimeInSeconds = settings.autoLogoutTimeInSeconds
  return autoLogoutTimeInSeconds
}

export const getAutoLogoutTimeInMinutes = (state: any) => {
  const autoLogoutTimeInSeconds = getAutoLogoutTimeInSeconds(state)
  const autoLogoutTimeInMinutes = autoLogoutTimeInSeconds / 60
  return autoLogoutTimeInMinutes
}

export const getDefaultFiat = (state: any) => {
  const settings = getSettings(state)
  const defaultFiat = settings.defaultFiat
  return defaultFiat
}
