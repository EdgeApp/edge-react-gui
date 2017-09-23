// @flow

export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_WALLET_TYPE = 'SELECT_WALLET_TYPE'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {Actions} from 'react-native-router-flux'

export const updateWalletName = (walletName: string) => ({
  type: UPDATE_WALLET_NAME,
  data: {walletName}
})

export const selectWalletType = (walletType: string) => ({
  type: SELECT_WALLET_TYPE,
  data: {walletType}
})

export const selectFiat = (fiat: string) => ({
  type: SELECT_FIAT,
  data: {fiat}
})

export const createWallet = (walletName: string, walletType: string/*, isoFiat: string */) => (dispatch: any, getState: any) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const plugins = SETTINGS_SELECTORS.getPlugins(state)
  const formattedWalletType = walletType.replace('wallet:', '').toLowerCase()
  let matchingPlugin = null
  for (const madePlugin of plugins.arrayPlugins) {
    for (const type of madePlugin.currencyInfo.walletTypes) {
      if (formattedWalletType === type.replace('wallet:', '')) {
        matchingPlugin = madePlugin
        break
      }
    }
    if (matchingPlugin) {
      break
    }
  }

  if (!matchingPlugin) {
    throw (new Error('Wallets/api.js Invalid wallet type:' + formattedWalletType))
  }

  const privateKeys = matchingPlugin.createPrivateKey(formattedWalletType)
  const walletInfo = {keys: privateKeys, type: formattedWalletType}
  const publicKeys = matchingPlugin.derivePublicKey(walletInfo)
  const keys = Object.assign({}, privateKeys, publicKeys)

  ACCOUNT_API.createWalletRequest(account, keys, walletType)
    .then(() => {
      Actions.walletList({type: 'reset'})
    })
}
