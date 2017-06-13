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

export const enablePinLoginRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { core: account } = state

    account.root.file('settings').setText()
    .then(text => {
      const settings = JSON.parse(text)
      settings.pinLoginEnabled = true

      account.root.file('settings').setText(settings)
    })
  }
}

export const disablePinLogin = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { core: account } = state

    account.root.file('settings').setText()
    .then(text => {
      const settings = JSON.parse(text)
      settings.pinLoginEnabled = false

      account.root.file('settings').setText(settings)
    })
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
