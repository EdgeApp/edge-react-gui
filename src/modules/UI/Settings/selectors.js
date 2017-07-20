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
