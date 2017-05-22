import { makeReactNativeIo } from 'react-native-airbitz-io'
import { addWallet as addWalletUI } from './UI/Wallets/action.js'
import { addWalletByKey } from './Login/action.js'

import { selectWalletById } from './UI/Wallets/action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/action.js'
import { makeContext } from 'airbitz-core-js'
import { disableLoadingScreenVisibility } from './action'
import { updatingBalance } from './Transactions/action'
import { updateExchangeRates } from './UI/components/ExchangeRate/action'

export const initializeAccount = (dispatch) => {
  makeReactNativeIo().then(io => {
    const context = makeContext({
      apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
      io
    })

    dispatch(addAirbitzToRedux(context))
    const callbacks = makeAccountCallbacks(dispatch)
    const account = context.loginWithPassword(
      'bob19',
      'Funtimes19',
      null,
      callbacks
    )

    return account
  })
  .then((account) => {
    dispatch(disableLoadingScreenVisibility())
    dispatch(addAccountToRedux(account))

    const supportedTypes = [
      'account-repo:co.airbitz.wallet'
    ]
    let allKeys = account.allKeys

    keys = allKeys.filter(key => {
      return supportedTypes.includes(key.type)
    })

    keys.forEach(key => {
      dispatch(addWalletByKey(key))
    })

    const firstWalletId = keys[0].id
    dispatch(selectWalletById(firstWalletId))
  })
}

makeAccountCallbacks = (dispatch) => {
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

    onKeysChanged: () => {
      console.log('onKeysChanged')
    }
  }

  return callbacks
}
