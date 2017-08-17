// @flow

export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_BLOCKCHAIN = 'SELECT_BLOCKCHAIN'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import * as LOGIN_ACTIONS from '../../../Login/action.js'

import { Actions } from 'react-native-router-flux'

export const updateWalletName = (walletName:string) => {
  return {
    type: UPDATE_WALLET_NAME,
    data: { walletName }
  }
}

export const selectBlockchain = (blockchain:string) => {
  return {
    type: SELECT_BLOCKCHAIN,
    data: { blockchain }
  }
}

export const selectFiat = (fiat:string) => {
  return {
    type: SELECT_FIAT,
    data: { fiat }
  }
}

export const createWallet = (walletName:string, walletType:string) => {
  return (dispatch:any, getState:any) => {
    const state = getState()

    const account = CORE_SELECTORS.getAccount(state)
    const plugins = SETTINGS_SELECTORS.getPlugins(state)

    let matchingPlugin = null
    for (const madePlugin of plugins.arrayPlugins) {
      for (const type of madePlugin.currencyInfo.walletTypes) {
        if (walletType.replace('wallet:', '') === type.replace('wallet:', '')) {
          matchingPlugin = madePlugin
          break
        }
      }
      if (matchingPlugin) {
        break
      }
    }

    if (!matchingPlugin) {
      throw (new Error('Wallets/api.js Invalid wallet type:' + walletType))
    }

    const privateKeys = matchingPlugin.createPrivateKey(walletType)
    const walletInfo = { keys: privateKeys, type: walletType }
    const publicKeys = matchingPlugin.derivePublicKey(walletInfo)
    const keys = Object.assign({}, privateKeys, publicKeys)

    ACCOUNT_API.createWalletRequest(account, keys, walletType)
    .then((walletId) => {
      Actions.walletList({type: 'reset'})
      dispatch(LOGIN_ACTIONS.updateWallets())
    })
  }
}
