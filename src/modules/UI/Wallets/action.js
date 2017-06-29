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
  }
}

export const archiveWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(upsertWallet(wallet))

    // automatically select the next active wallet
    const { selectedWalletId } = state.ui.wallets
    if (selectedWalletId === wallet.id) {
      const { activeWalletIds } = state.ui.wallets
      dispatch(selectWalletId(activeWalletIds[0]))
    }
  }
}

export const deleteWalletRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(deleteWallet(walletId))
    // automatically select the next active wallet
    const { selectedWalletId } = state.ui.wallets
    if (selectedWalletId === walletId) {
      const { activeWalletIds } = state.ui.wallets
      dispatch(selectWalletId(activeWalletIds[0]))
    }
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

export const refreshWallets = () => {
  return (dispatch, getState) => {
    const state = getState()
    const wallets = Object.values(state.core.wallets.byId)

    wallets.forEach(wallet => {
      dispatch(upsertWallet(wallet))
    })
  }
}

export const upsertWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    if (!selectedWalletId && !wallet.archived && !wallet.deleted) {
      dispatch(selectWalletId(wallet.id))
    }

    return dispatch(upsertWallet(wallet))
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
