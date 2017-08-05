export const getSettings = (state) => {
  const settings = state.ui.settings
  return settings
}

export const getDenominationIndex = (state, currencyCode) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  let denominationIndex
  if (currencySettings) {
    denominationIndex = currencySettings.denomination
  }
  return denominationIndex
}

export const getPlugins = (state) => {
  const settings = getSettings(state)
  const plugins = settings.plugins
  return plugins
}

export const getPlugin = (state, type) => {
  const plugins = getPlugins(state)
  const plugin = plugins[type]
  return plugin
}

export const getBitcoinPlugin = (state) => {
  const bitcoinPlugin = getPlugin(state, 'bitcoin')
  return bitcoinPlugin
}

export const getEthereumPlugin = (state) => {
  const ethereumPlugin = getPlugin(state, 'ethereum')
  return ethereumPlugin
}
