// @flow

export const getSettings = (state:any) => {
  const settings = state.ui.settings
  return settings
}

export const getDenominationIndex = (state:any, currencyCode:string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  let denominationIndex:string
  if (currencySettings) {
    denominationIndex = currencySettings.denomination
  }
  return denominationIndex
}

export const getPlugins = (state:any) => {
  const settings = getSettings(state)
  const plugins = settings.plugins
  return plugins
}

export const getSupportedWalletTypes = (state:any) => {
  const plugins = getPlugins(state)
  const supportedWalletTypes = plugins.supportedWalletTypes
  return supportedWalletTypes
}
