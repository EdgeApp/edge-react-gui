// @flow

import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import { displayErrorAlert } from '../modules/UI/components/ErrorAlert/actions.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const updateReceiveAddress = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  WALLET_API.getReceiveAddress(wallet, currencyCode)
    .then(receiveAddress => {
      dispatch({
        type: 'UPDATE_RECEIVE_ADDRESS_SUCCESS',
        data: { receiveAddress }
      })
    })
    .catch(error => {
      dispatch(displayErrorAlert(error))
    })
}

export const saveReceiveAddress = (receiveAddress: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const selectedCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  const onSuccess = () => {
    dispatch(updateReceiveAddress(selectedWalletId, selectedCurrencyCode))
  }
  const onError = e => {
    console.log(e)
  }

  wallet
    .saveReceiveAddress(receiveAddress)
    .then(onSuccess)
    .catch(onError)
}
