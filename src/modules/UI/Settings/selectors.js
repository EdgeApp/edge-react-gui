// @flow
import isoFiatDenominations from './IsoFiatDenominations.js'

export const getSettings = (state: any) => {
  const settings = state.ui.settings
  return settings
}

export const getDenominationIndex = (state: any, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  let denominationIndex:string
  if (currencySettings) {
    denominationIndex = currencySettings.denomination
  }
  console.log('in getDenominationIndex, settings is: ', settings, ' , currencySettings is: ', currencySettings, ' , currencyCode is: ', currencyCode, ' , denominationIndex is: ', denominationIndex)  
  return denominationIndex
}

export const getCurrencySettings = (state: any, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  return currencySettings
}

export const getDisplayDenomination = (state: any, currencyCode: string) => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  const multiplier = currencySettings.denomination.toString()
  const denominations = currencySettings.denominations
  const displayDenomination = denominations.find(denomination => {
    return denomination.multiplier.toString() === multiplier
  })
  return displayDenomination
}

export const getNativeToDenominationRatio = (state: any, currencyCode: string) => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  const nativeToDenominationRatio = currencySettings.displayDenomination.nativeToDenominationRatio
  return nativeToDenominationRatio
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
  const supportedWalletTypes = plugins.reduce((walletTypes, plugin) => ({
    ...walletTypes,
    [plugin.currencyInfo.currencyName]: plugin.currencyInfo.walletTypes[0]
  }), {})
  return supportedWalletTypes
}
