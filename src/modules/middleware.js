import { makeReactNativeIo } from 'react-native-airbitz-io'
import { addAccountToRedux, addAirbitzToRedux, addWalletByKey } from './Login/action.js'

import { selectWalletById } from './UI/Wallets/action.js'
import { makeContext } from 'airbitz-core-js'
import { disableLoadingScreenVisibility } from './action'

export const initializeAccount = (dispatch) => {
  makeReactNativeIo().then(io => {
    const context = makeContext({
      apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
      io
    })

    dispatch(addAirbitzToRedux(context))
    const callbacks = makeAccountCallbacks(dispatch)
    const account = context.loginWithPassword(
      'bob2',
      'bob2',
      null,
      callbacks
    )

    return account
  })
  .then((account) => {
    dispatch(addAccountToRedux(account))
    dispatch(disableLoadingScreenVisibility())

    const supportedTypes = [
      'wallet:shitcoin'
    ]
    let allKeys = account.allKeys

    const keys = allKeys.filter(key => {
      return supportedTypes.includes(key.type)
    })

    keys.forEach(key => {
      dispatch(addWalletByKey(key))
    })

    const firstWalletId = keys[0].id
    dispatch(selectWalletById(firstWalletId))
  })
}

const makeAccountCallbacks = (dispatch) => {
  const callbacks = {
    onRemotePasswordChange: () => {
      console.log('onRemotePasswordChange')
    },

    onOTPAdded: () => {
      console.log('onOTPAdded')
    },

    onOTPSkew: () => {
      console.log('onOTPSkew')
    },

    onKeyListChanged: () => {
      console.log('onKeyListChanged')
    }
  }

  return callbacks
}
