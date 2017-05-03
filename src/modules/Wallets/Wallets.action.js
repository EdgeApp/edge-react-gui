export const ADD_WALLET    = 'ADD_WALLET'
export const SELECT_WALLET = 'SELECT_WALLET'

export function addWallet (newWallet, order) {
  newWallet.order = order
  let id = {newWallet}
  return {
    type: ADD_WALLET,
    data: id
  }
}

export function selectWallet (data) {
  return {
    type: SELECT_WALLET,
    data
  }
}
