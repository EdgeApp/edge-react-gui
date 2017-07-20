export const getSettings = (state) => {
  const settings = state.ui.settings
  return settings
}

export const getDenominationIndex = (state, currencyCode) => {
  const settings = getSettings(state)
  const denominationIndex = settings[currencyCode].denomination
  return denominationIndex
}
