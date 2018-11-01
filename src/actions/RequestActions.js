// @flow

import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'

export const updateReceiveAddressSuccess = (receiveAddress: Object) => ({
  type: 'UPDATE_RECEIVE_ADDRESS_SUCCESS',
  data: { receiveAddress }
})

export const updateReceiveAddressError = (error: Object) => ({
  type: 'UPDATE_RECEIVE_ADDRESS_ERROR',
  data: { error }
})

export const updateAmountRequestedInCrypto = (amountRequestedInCrypto: number) => ({
  type: 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO',
  data: { amountRequestedInCrypto }
})

export const updateAmountReceivedInCrypto = (amountReceivedInCrypto: number) => ({
  type: 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO',
  data: { amountReceivedInCrypto }
})

export const updateAmountRequestedInFiat = (amountRequestedInFiat: number) => ({
  type: 'UPDATE_AMOUNT_REQUESTED_IN_FIAT',
  data: { amountRequestedInFiat }
})

export const updateInputCurrencySelected = (inputCurrencySelected: string) => ({
  type: 'UPDATE_INPUT_CURRENCY_SELECTED',
  data: { inputCurrencySelected }
})

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
