export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_BLOCKCHAIN = 'SELECT_BLOCKCHAIN'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

// import * as WALLET_ACTIONS from '../../Wallets/action.js'
import * as LOGIN_ACTIONS from '../../../Login/action.js'

import { Actions } from 'react-native-router-flux'

import { makeBitcoinPlugin } from 'airbitz-currency-bitcoin'
import { makeEthereumPlugin } from 'airbitz-currency-ethereum'

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
    const bitcoinPlugin = makeBitcoinPlugin({ io })
    const ethereumPlugin = makeEthereumPlugin({ io })
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
