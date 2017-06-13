// import { activateWalletSuccess, archiveWalletSuccess } from ''

export const createWalletRequest = (walletType, keys) => {
  return (dispatch, getState) => {
    // dispatch(activateWalletStart(walletId))
    const { account } = getState().core
    createWallet(account, walletType, keys)
  }
}

export const activateWalletRequest = walletId => {
  return (dispatch, getState) => {
    // dispatch(activateWalletStart(walletId))
    const { account } = getState().core
    activateWallet(account, walletId)
  }
}

export const archiveWalletRequest = walletId => {
  return (dispatch, getState) => {
    // dispatch(archiveWalletStart(walletId))
    const { account } = getState().core
    archiveWallet(account, walletId)
  }
}

export const deleteWalletRequest = walletId => {
  return (dispatch, getState) => {
    // dispatch(archiveWalletStart(walletId))
    const { account } = getState().core
    deleteWallet(account, walletId)
  }
}

//  Helper functions
const createWallet = (account, walletType, keys) => {
  return account.createWallet(walletType, keys)
}

const activateWallet = (account, walletId) => {
  console.log('activating wallet', walletId)
  return account.changeKeyStates({
    walletId: { archived: false }
  })
}

const archiveWallet = (account, walletId) => {
  console.log('archiving wallet', walletId)
  return account.changeKeyStates({
    walletId: { archived: true }
  })
}

const deleteWallet = (account, walletId) => {
  console.log('deleting wallet', walletId)
  return account.changeKeyStates({
    walletId: { deleted: true }
  })
}
