export const getSelectedWalletId = (state) => {
  const selectedWalletId = state.ui.wallets.selectedWalletId
  return selectedWalletId
}

export const getSelectedCurrencyCode = (state) => {
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
  return selectedCurrencyCode
}

export const getSelectedWallet = (state) => {
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const wallets = state.ui.wallets.byId
  const selectedWallet = wallets[selectedWalletId]
  return selectedWallet
}

export const getActiveWalletIds = (state) => {
  const activeWalletIds = state.ui.wallets.activeWalletIds
  return activeWalletIds
}

export const getArchivedWalletIds = (state) => {
  const archivedWalletIds = state.ui.wallets.archivedWalletIds
  return archivedWalletIds
}
