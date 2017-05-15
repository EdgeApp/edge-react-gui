export const ADD_WALLET = 'ADD_WALLET'
export const SELECT_WALLET = 'SELECT_WALLET'
export const COMPLETE_DELETE_WALLET = 'COMPLETE_DELETE_WALLET'

export function addWallet (wallet, order) {
  return {
    type: ADD_WALLET,
    data: {
      wallet,
      order
    }
  }
}

export function selectWallet (data) {
  return {
    type: SELECT_WALLET,
    data
  }
}

export function completeDeleteWallet (key) {
  return {
    type: COMPLETE_DELETE_WALLET,
    data: key
  }
}
