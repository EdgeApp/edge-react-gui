// import { renameWalletStart } from ''

export const renameWalletRequest = (walletId, name) => {
  return (dispatch, getState) => {
    // dispatch(renameWalletStart(walletId))
    const state = getState()
    const wallet = state.core.wallets.byId[walletId]
    renameWallet(wallet, name)
  }
}

export const activateWalletRequest = wallet => {
  return wallet.startEngine()
}

export const archiveWalletRequest = wallet => {
  return wallet.stopEngine()
}

//  Helper functions
const renameWallet = (wallet, name) => {
  return wallet.renameWallet(name)
}
