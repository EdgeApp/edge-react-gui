export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_BLOCKCHAIN = 'SELECT_BLOCKCHAIN'
export const SELECT_FIAT = 'SELECT_FIAT'
import { Actions } from 'react-native-router-flux'

import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
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
    const { account, context } = state
    const { io } = context
    const keys = makeShitcoinPlugin({ io }).createMasterKeys('shitcoin')

    createWalletRequest(account, keys, walletType)
    .then(Actions.walletList)
  }
}
