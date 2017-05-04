export const ADD_WALLET    = 'ADD_WALLET'
export const SELECT_WALLET = 'SELECT_WALLET'
export const COMPLETE_DELETE_WALLET = 'COMPLETE_DELETE_WALLET'

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

export function completeDeleteWallet(key) {
  return {
    type: COMPLETE_DELETE_WALLET,
    data: key
  }
}