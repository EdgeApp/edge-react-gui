const PREFIX = 'Core/Wallets/'
const ADD_WALLET = 'ADD_WALLET'
const REMOVE_WALLET = 'REMOVE_WALLET'

export const addWallet = (wallet, keyInfo) => {
  return {
    type: PREFIX + ADD_WALLET,
    data: { wallet, keyInfo }
  }
}

export const removeWallet = walletId => {
  return {
    type: PREFIX + REMOVE_WALLET,
    data: { walletId }
  }
}
