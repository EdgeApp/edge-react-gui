export const PREFIX = 'Core/Wallets/'
export const UPDATE_WALLETS = PREFIX + 'UPDATE_WALLETS'

export const updateWallets = (activeWalletIds, archivedWalletIds, currencyWallets) => {
  return {
    type: UPDATE_WALLETS,
    data: {
      activeWalletIds,
      archivedWalletIds,
      currencyWallets
    }
  }
}

export const updateWalletsRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    const { activeWalletIds, archivedWalletIds, currencyWallets } = account

    return dispatch(updateWallets(activeWalletIds, archivedWalletIds, currencyWallets))
  }
}
