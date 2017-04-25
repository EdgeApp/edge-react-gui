export const ADD_WALLET = 'ADD_WALLET'

export function addWallet (newWallet) {
  return {
    type: ADD_WALLET,
    newWallet
  }
}
