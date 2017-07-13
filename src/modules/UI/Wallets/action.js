export const PREFIX = 'UI/Wallets/'

export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'
export const DELETE_WALLET = PREFIX + 'DELETE_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'

export const SELECT_WALLET_ID = PREFIX + 'SELECT_WALLET_ID'
export const SELECT_CURRENCY_CODE = PREFIX + 'SELECT_CURRENCY_CODE'

import * as UI_SELECTORS from '../selectors.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'

export const activateWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    // automatically select the first active wallet
    if (!selectedWalletId) {
      dispatch(selectWalletId(wallet.id))
      dispatch(selectCurrencyCode(wallet.currencyInfo.currencyCode))
    }
    dispatch(upsertWallet(wallet))
  }
}

export const archiveWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(upsertWallet(wallet))

    // automatically select the next active wallet
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    if (selectedWalletId === wallet.id) {
      const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
      dispatch(selectWalletId(activeWalletIds[0]))
    }
  }
}

export const deleteWalletRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(deleteWallet(walletId))
    // automatically select the next active wallet
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    if (selectedWalletId === walletId) {
      const activeWalletIds = UI_SELECTORS.getActiveWalletIds(state)
      dispatch(selectWalletId(activeWalletIds[0]))
    }
  }
}

export const selectWallet = (walletId, currencyCode) => {
  return (dispatch) => {
    dispatch(selectWalletId(walletId))
    dispatch(selectCurrencyCode(currencyCode))
  }
}

export const selectWalletIdRequest = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

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

export const selectCurrencyCode = (currencyCode) => {
  return {
    type: SELECT_CURRENCY_CODE,
    data: { currencyCode }
  }
}

export const renameWalletSuccess = walletId => {
  return dispatch => {
    dispatch(refreshWallet(walletId))
  }
}

export const refreshWallet = (walletId) => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = CORE_SELECTORS.getWallet(state, walletId)

    if (wallet) {
      console.log('updating wallet balance', walletId)
      return dispatch(upsertWallet(wallet))
    }
    console.log('wallet doesn\'t exist yet', walletId)
  }
}

export const refreshWallets = () => {
  return (dispatch, getState) => {
    const state = getState()
    const wallets = CORE_SELECTORS.getWallets(state)

    wallets.forEach(wallet => {
      dispatch(upsertWallet(wallet))
    })
  }
}

export const upsertWalletRequest = wallet => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

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
