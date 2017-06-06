export const ADD_WALLET = 'ADD_WALLET'
export const SELECT_WALLET_BY_ID = 'SELECT_WALLET_BY_ID'
export const COMPLETE_DELETE_WALLET = 'COMPLETE_DELETE_WALLET'

export const addWallet = (wallet, order) => {
  return {
    type: ADD_WALLET,
    data: {
      wallet,
      order
    }
  }
}

export const selectWalletById = (id) => {
  return {
    type: SELECT_WALLET_BY_ID,
    data: {
      id
    }
  }
}

export const completeDeleteWallet = (key) => {
  return {
    type: COMPLETE_DELETE_WALLET,
    data: key
  }
}

export const renameWallet = (walletId, walletName) => {
  return (dispatch, getState) => {
    const wallet = getState().wallets.byId[walletId]
    dispatch(refreshWallet(wallet))
  }
}

export const refreshWallet = walletId => {
  return (dispatch, getState) => {
    const wallet = getState().wallets.byId[walletId]
    if (wallet) {
      dispatch(addWallet(wallet))
    }
  }
}
