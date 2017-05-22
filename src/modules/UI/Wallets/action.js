export const ADD_WALLET = 'ADD_WALLET'
export const SELECT_WALLET_BY_ID = 'SELECT_WALLET_BY_ID'
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

export function selectWalletById (id) {
  return {
    type: SELECT_WALLET_BY_ID,
    data: {
      id
    }
  }
}

export function completeDeleteWallet (key) {
  return {
    type: COMPLETE_DELETE_WALLET,
    data: key
  }
}
