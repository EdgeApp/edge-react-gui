export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_BLOCKCHAIN = 'SELECT_BLOCKCHAIN'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

// import * as WALLET_ACTIONS from '../../Wallets/action.js'
import * as LOGIN_ACTIONS from '../../../Login/action.js'

import { Actions } from 'react-native-router-flux'
import { base64 }from 'rfc4648'

import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeEthereumPlugin } from 'airbitz-currency-ethereum'
import { createWalletRequest } from '../../../Core/Account/api.js'

export const updateWalletName = walletName => {
  return {
    type: UPDATE_WALLET_NAME,
    data: { walletName }
  }
}

export const selectBlockchain = blockchain => {
  return {
    type: SELECT_BLOCKCHAIN,
    data: { blockchain }
  }
}

export const selectFiat = fiat => {
  return {
    type: SELECT_FIAT,
    data: { fiat }
  }
}

export const createWallet = (walletName, walletType) => {
  return (dispatch, getState) => {
    const state = getState()

    const account = CORE_SELECTORS.getAccount(state)
    const io = CORE_SELECTORS.getIO(state)
    const shitcoinPlugin = makeShitcoinPlugin({ io })
    const ethereumPlugin = makeEthereumPlugin({ io })
    const type = walletType.replace('wallet:', '').toLowerCase()

    if (type === shitcoinPlugin.getInfo().walletTypes[0]) {
      keys = shitcoinPlugin.createMasterKeys(type)
    } else if (type === ethereumPlugin.getInfo().walletTypes[0]) {
      keys = ethereumPlugin.createMasterKeys(type)
    } else if (walletType === 'bitcoin') {
      keys = shitcoinPlugin.createMasterKeys(type)
    } else {
      throw (new Error('CreateWallet/action.js Invalid wallet type:' + type))
    }
    const array = io.random(32)
    const id = base64.stringify(array)

    const keyInfo = {
      id,
      type,
      keys
    }

    ACCOUNT_API.createWalletRequest(account, keyInfo, walletType)
    .then((walletId) => {
      Actions.walletList()
      dispatch(LOGIN_ACTIONS.updateWallets())
    })
  }
}
