export const PREFIX = 'UI/Wallets/'
export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'
export const DELETE_WALLET = PREFIX + 'DELETE_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'
export const SELECT_WALLET_ID = PREFIX + 'SELECT_WALLET_ID'

export const activateWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets
    // automatically select the first active wallet
    if (!selectedWalletId) {
      dispatch(selectWalletId(wallet.id))
    }
    dispatch(upsertWallet(wallet))
    dispatch(activateWalletId(wallet.id))
  }
}

export const archiveWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    // const { selectedWalletId } = state.ui.wallets
    // automatically select the next active wallet
    // if (selectedWalletId === wallet.id) {
    //   const { activeWalletIds } = state.ui.wallets
    //   dispatch(selectWalletId(activeWalletIds[1]))
    // }
    dispatch(upsertWallet(wallet))
    dispatch(archiveWalletId(wallet.id))
  }
}

export const deleteWalletRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets
    // automatically select the next active wallet
    // if (selectedWalletId === walletId) {
    //   const { activeWalletIds } = state.ui.wallets
    //   dispatch(selectWalletId(activeWalletIds[1]))
    // }
    dispatch(deleteWallet(walletId))
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
      dispatch(upsertWallet(wallet))
    }
  }
}

export const refreshWallets = () => {
  return (dispatch, getState) => {
    const state = getState()
    const wallets = Object.values(state.core.wallets.byId)

    wallets.forEach(wallet => {
      dispatch(upsertWallet(wallet))
    })
  }
}

export const upsertWallet = wallet => {
  return {
    type: UPSERT_WALLET,
    data: { wallet }
  }
}

export const deleteWallet = walletId => {
  return {
    type: DELETE_WALLET,
    data: { walletId }
  }
}
