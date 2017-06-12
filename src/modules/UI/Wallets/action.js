export const ACTIVATE_WALLET_ID = 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = 'ARCHIVE_WALLET_ID'
export const DELETE_WALLET_ID = 'DELETE_WALLET_ID'
export const SELECT_WALLET_ID = 'SELECT_WALLET_ID'

export const ADD_WALLET = 'ADD_WALLET'

export const activateWalletId = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    dispatch(activateWalletId(walletId))

    if (!selectedWalletId) {
      dispatch(selectedWalletId(walletId))
    }
  }
}

const activateWalletId = walletId => {
  return {
    type: ACTIVATE_WALLET_ID,
    data: { walletId }
  }
}

export const archiveWalletId = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    dispatch(archiveWalletId(walletId))

    if (selectedWalletId === walletId) {
      dispatch(selectNextWalletId())
    }
  }
}

export const archiveWalletId = walletId => {
  return {
    type: ARCHIVE_WALLET_ID,
    data: { walletId }
  }
}

export const deleteWalletId = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    dispatch(deleteWalletId(walletId))

    if (selectedWalletId === walletId) {
      dispatch(selectNextWalletId())
    }
  }
}

export const deleteWalletId = walletId => {
  return {
    type: DELETE_WALLET_ID,
    data: { walletId }
  }
}

export const selectWalletId = walletId => {
  return {
    type: SELECT_WALLET_ID,
    data: { walletId }
  }
}

const selectNextWalletId = () => {
  return (dispatch, getState) => {
    
  }
}

export const renameWalletSuccess = walletId => {
  return dispatch => {
    dispatch(refreshWallet(walletId))
  }
}

export const refreshWallet = walletId => {
  return (dispatch, getState) => {
    const wallet = getState().core.wallets.byId[walletId]
    if (wallet) {
      dispatch(addWallet(wallet))
    }
  }
}

export const addWallet = (wallet, order) => {
  return {
    type: ADD_WALLET,
    data: {
      wallet,
      order
    }
  }
}
