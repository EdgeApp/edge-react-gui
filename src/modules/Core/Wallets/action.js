const PREFIX = 'Core/Wallets/'
const ADD_WALLET = 'ADD_WALLET'
const DELETE_WALLET = 'DELETE_WALLET'
const WALLET_UPDATE_START = 'WALLET_UPDATE_START'
const WALLET_UPDATE_COMPLETE = 'WALLET_UPDATE_COMPLETE'
const REMOVE_PENDING_STATUS = 'REMOVE_PENDING_STATUS'

export const addWallet = (wallet, keyInfo) => {
  return {
    type: PREFIX + ADD_WALLET,
    data: { wallet, keyInfo }
  }
}

export const deleteWallet = walletId => {
  return {
    type: PREFIX + DELETE_WALLET,
    data: { walletId }
  }
}

export const walletUpdateStart = walletId => {
  return {
    type: PREFIX + WALLET_UPDATE_START,
    data: { walletId }
  }
}

export const walletUpdateComplete = walletId => {
  return {
    type: PREFIX + WALLET_UPDATE_COMPLETE,
    data: { walletId }
  }
}

export const removePendingStatus = walletId => {
  return {
    type: PREFIX + REMOVE_PENDING_STATUS,
    data: { walletId }
  }
}
