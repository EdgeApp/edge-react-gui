export const ADD_WALLET    = 'ADD_WALLET'
export const SELECT_WALLET = 'SELECT_WALLET'

export function addWallet (newWallet) {
  return {
    type: ADD_WALLET,
    newWallet
  }
}

export function selectWallet (data) {
  return {
    type: SELECT_WALLET,
    data
  }
}
