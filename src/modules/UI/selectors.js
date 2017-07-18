export const getWallets = (state) => {
  const wallets = state.ui.wallets.byId
  return wallets
}

export const getSelectedWalletId = (state) => {
  const selectedWalletId = state.ui.wallets.selectedWalletId
  return selectedWalletId
}

export const getSelectedCurrencyCode = (state) => {
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
  return selectedCurrencyCode
}

export const getSelectedWallet = (state) => {
  const walletId = getSelectedWalletId(state)
  const wallets = getWallets(state)
  const selectedWallet = wallets[walletId]
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

export const getTransactions = (state) => {
  const transactions = state.ui.scenes.transactionList.transactions
  return transactions
}
