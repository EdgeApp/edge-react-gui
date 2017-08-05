export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_BLOCKCHAIN = 'SELECT_BLOCKCHAIN'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import * as LOGIN_ACTIONS from '../../../Login/action.js'

import { Actions } from 'react-native-router-flux'

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
    const bitcoinPlugin = SETTINGS_SELECTORS.getBitcoinPlugin(state)
    const ethereumPlugin = SETTINGS_SELECTORS.getEthereumPlugin(state)

    const type = walletType.replace('wallet:', '').toLowerCase()
    let keys
    if (type === ethereumPlugin.getInfo().walletTypes[0]) {
      keys = ethereumPlugin.createMasterKeys(type)
    } else if (type === 'bitcoin') {
      keys = bitcoinPlugin.createMasterKeys(type)
    } else {
      throw (new Error('CreateWallet/action.js Invalid wallet type:' + type))
    }

    ACCOUNT_API.createWalletRequest(account, keys, walletType)
    .then((walletId) => {
      Actions.walletList()
      dispatch(LOGIN_ACTIONS.updateWallets())
    })
  }
}
