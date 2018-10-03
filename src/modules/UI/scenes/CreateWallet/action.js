// @flow

import { Actions } from 'react-native-router-flux'

import * as Constants from '../../../../constants/indexConstants.js'
import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import { createWalletStart, createWalletSuccess, selectWallet as selectWalletAction } from '../../Wallets/action'

export const updateWalletName = (walletName: string) => ({
  type: 'UPDATE_WALLET_NAME',
  data: { walletName }
})

export const selectWalletType = (walletType: string) => ({
  type: 'SELECT_WALLET_TYPE',
  data: { walletType }
})

export const selectFiat = (fiat: string) => ({
  type: 'SELECT_FIAT',
  data: { fiat }
})

export const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string,
  popScene: boolean = true,
  selectWallet: boolean = false
) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(createWalletStart())
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  return ACCOUNT_API.createCurrencyWalletRequest(account, type, {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {}
  }).then(edgeWallet => {
    Actions.popTo(Constants.WALLET_LIST_SCENE)
    dispatch(createWalletSuccess())
    if (selectWallet) {
      dispatch(selectWalletAction(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
    }
  })
}
