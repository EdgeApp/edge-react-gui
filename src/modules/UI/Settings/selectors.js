export const getSettings = (state) => {
  const settings = state.ui.settings
  return settings
}

export const getDenominationIndex = (state, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  let denominationIndex
  if (currencySettings) {
    denominationIndex = currencySettings.denomination
  }
  return denominationIndex
}

export const getCurrencySettings = (state, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  return currencySettings
}

export const getCurrencyDenomination = (state, currencyCode: string) => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  const denomination = currencySettings.denomination
  return denomination
}

export const getNativeToDenominationRatio = (state, currencyCode: string) => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  const nativeToDenominationRatio = currencySettings.denomination.nativeToDenominationRatio
  return nativeToDenominationRatio
}

export const getAdapters = (state) => {
  const settings = getSettings(state)
  const adapters = settings.adapters
  return adapters
}

export const getBaseDenomination = (state, currencyCode: string): string => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  currencySettings.denomination
}
