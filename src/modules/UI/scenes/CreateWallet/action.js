// @flow

export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_WALLET_TYPE = 'SELECT_WALLET_TYPE'
export const SELECT_FIAT = 'SELECT_FIAT'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

import {Actions} from 'react-native-router-flux'

import * as WalletActions from '../../Wallets/action'

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

export const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string,
  popScene: boolean = true,
  selectWallet: boolean = false
) => (dispatch: any, getState: any) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  return ACCOUNT_API.createCurrencyWalletRequest(account, walletType, {
    name: walletName,
    fiatCurrencyCode
  }).then((abcWallet) => {
    if (popScene) {
      Actions.pop()
    } else if (selectWallet) {
      dispatch(WalletActions.selectWallet(abcWallet.id, abcWallet.currencyInfo.currencyCode))
    }
  })
}
