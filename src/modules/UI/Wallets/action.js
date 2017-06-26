export const ACTIVATE_WALLET_ID = 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = 'ARCHIVE_WALLET_ID'
export const DELETE_WALLET_ID = 'DELETE_WALLET_ID'
export const SELECT_WALLET_ID = 'SELECT_WALLET_ID'

export const ADD_WALLET = 'ADD_WALLET'

export const activateWalletIdRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets
    // automatically select the first active wallet
    if (!selectedWalletId) {
      dispatch(selectWalletId(walletId))
    }
    dispatch(activateWalletId(walletId))
  }
}

export const archiveWalletIdRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets
    // automatically select the next active wallet
    if (selectedWalletId === walletId) {
      const { activeWalletIds } = state.ui.wallets
      dispatch(selectWalletId(activeWalletIds[1]))
    }
    dispatch(archiveWalletId(walletId))
  }
}

export const deleteWalletIdRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets
    // automatically select the next active wallet
    if (selectedWalletId === walletId) {
      const { activeWalletIds } = state.ui.wallets
      dispatch(selectWalletId(activeWalletIds[1]))
    }
    dispatch(deleteWalletId(walletId))
  }
}

export const selectWalletIdRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    if (!selectedWalletId) {
      dispatch(selectWalletId(walletId))
    }
  }
}

export const activateWalletId = walletId => {
  return {
    type: ACTIVATE_WALLET_ID,
    data: { walletId }
  }
}

export const archiveWalletId = walletId => {
  return {
    type: ARCHIVE_WALLET_ID,
    data: { walletId }
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
