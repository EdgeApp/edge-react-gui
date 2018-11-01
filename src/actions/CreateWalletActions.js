// @flow

import { showModal } from 'edge-components'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'
import { selectWallet as selectWalletAction } from './WalletActions.js'

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

  dispatch({ type: 'UI/WALLETS/CREATE_WALLET_START' })
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  return ACCOUNT_API.createCurrencyWalletRequest(account, type, {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {}
  })
    .then(edgeWallet => {
      Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
      if (selectWallet) {
        dispatch(selectWalletAction(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
      }
    })
    .catch(async error => {
      await showModal(errorModal(s.strings.create_wallet_failed, error))
      Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
    })
}
