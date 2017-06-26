export const PREFIX = 'Core/Wallets/'
export const ADD_WALLET = PREFIX + 'ADD_WALLET'
export const DELETE_WALLET = PREFIX + 'DELETE_WALLET'
export const UPDATE_WALLET_START = PREFIX + 'UPDATE_WALLET_START'
export const UPDATE_WALLET_COMPLETE = PREFIX + 'UPDATE_WALLET_COMPLETE'
export const REMOVE_PENDING_STATUS = PREFIX + 'REMOVE_PENDING_STATUS'

export const addWallet = wallet => {
  return {
    type: ADD_WALLET,
    data: { wallet }
  }
}

export const deleteWallet = walletId => {
  return {
    type: DELETE_WALLET,
    data: { walletId }
  }
}

export const updateWalletStart = walletId => {
  return {
    type: UPDATE_WALLET_START,
    data: { walletId }
  }
}

export const updateWalletComplete = walletId => {
  return {
    type: UPDATE_WALLET_COMPLETE,
    data: { walletId }
  }
}

export const removePendingStatus = walletId => {
  return {
    type: REMOVE_PENDING_STATUS,
    data: { walletId }
  }
}
