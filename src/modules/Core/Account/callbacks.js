import { updateWallets } from '../Wallets/action.js'

export const makeAccountCallbacks = dispatch => {
  const callbacks = {
    onDataChanged: () => {
      console.log('onDataChanged')
    },

    onKeyListChanged: keyInfos => {
      console.log('onKeyListChanged')
      dispatch(updateWallets(keyInfos))
    },

    onLoggedOut: () => {
      console.log('onLoggedOut')
    },

    onOTPRequired: () => {
      console.log('onOTPRequired')
    },

    onOTPSkew: () => {
      console.log('onOTPSkew')
    },

    onRemotePasswordChanged: () => {
      console.log('onRemotePasswordChanged')
    }
  }

  return callbacks
}
