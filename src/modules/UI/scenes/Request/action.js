// @flow

import * as Constants from '../../../../constants/indexConstants.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'

export const UPDATE_RECEIVE_ADDRESS = 'UPDATE_RECEIVE_ADDRESS'
export const UPDATE_RECEIVE_ADDRESS_START = 'UPDATE_RECEIVE_ADDRESS_START'
export const UPDATE_RECEIVE_ADDRESS_ERROR = 'UPDATE_RECEIVE_ADDRESS_ERROR'
export const SAVE_RECEIVE_ADDRESS = 'SAVE_RECEIVE_ADDRESS'
export const UPDATE_INPUT_CURRENCY_SELECTED = 'UPDATE_INPUT_CURRENCY_SELECTED'

export const updateReceiveAddress = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  const onSuccess = receiveAddress => {
    dispatch(updateReceiveAddressSuccess(receiveAddress))
  }
  const onError = error => {
    // console.log('Core Error', error)
    dispatch(updateReceiveAddressError(error))
  }

  WALLET_API.getReceiveAddress(wallet, currencyCode)
    .then(onSuccess)
    .catch(onError)
}

export const updateInputCurrencySelected = (inputCurrencySelected: string) => ({
  type: UPDATE_INPUT_CURRENCY_SELECTED,
  data: { inputCurrencySelected }
})

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

export const updateReceiveAddressSuccess = (receiveAddress: Object) => ({
  type: Constants.UPDATE_RECEIVE_ADDRESS_SUCCESS,
  data: { receiveAddress }
})

export const updateReceiveAddressError = (error: Object) => ({
  type: UPDATE_RECEIVE_ADDRESS_ERROR,
  data: { error }
})

export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const updateAmountRequestedInCrypto = (amountRequestedInCrypto: number) => ({
  type: UPDATE_AMOUNT_REQUESTED_IN_CRYPTO,
  data: { amountRequestedInCrypto }
})

export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'
export const updateAmountReceivedInCrypto = (amountReceivedInCrypto: number) => ({
  type: UPDATE_AMOUNT_RECEIVED_IN_CRYPTO,
  data: { amountReceivedInCrypto }
})

export const UPDATE_AMOUNT_REQUESTED_IN_FIAT = 'UPDATE_AMOUNT_REQUESTED_IN_FIAT'
export const updateAmountRequestedInFiat = (amountRequestedInFiat: number) => ({
  type: UPDATE_AMOUNT_REQUESTED_IN_FIAT,
  data: { amountRequestedInFiat }
})

export const UPDATE_METADATA = 'UPDATE_METADATA'
