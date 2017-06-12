// import { renameWalletStart } from ''

export const renameWalletRequest = (wallet, name) => {
  return wallet.renameWallet(name)
}

export const activateWalletRequest = wallet => {
  return wallet.startEngine()
}

export const archiveWalletRequest = wallet => {
  return wallet.stopEngine()
}

export const deleteWalletRequest = wallet => {
  return wallet.stopEngine()
}
