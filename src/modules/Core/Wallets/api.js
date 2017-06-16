// import { renameWalletStart } from ''

export const renameWalletRequest = (walletId, name) => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = state.core.wallets.byId[walletId]

    return wallet.renameWallet(name)
  }
}

export const activateWalletRequest = wallet => {
  return wallet.startEngine()
}

export const archiveWalletRequest = wallet => {
  wallet.stopEngine()
}

export const deleteWalletRequest = wallet => {
  wallet.stopEngine()
}
