export const ADD_WALLET = 'ADD_WALLET'
export const REMOVE_WALLET = 'REMOVE_WALLET'

export const addWallet = wallet => {
  return {
    type: ADD_WALLET,
    data: { wallet }
  }
}

export const removeWallet = walletId => {
  return {
    type: REMOVE_WALLET,
    data: { walletId }
  }
}
