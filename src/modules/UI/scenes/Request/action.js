export const UPDATE_RECEIVE_ADDRESS = 'UPDATE_RECEIVE_ADDRESS'
export const UPDATE_RECEIVE_ADDRESS_START = 'UPDATE_RECEIVE_ADDRESS_START'
export const UPDATE_RECEIVE_ADDRESS_SUCCESS = 'UPDATE_RECEIVE_ADDRESS_SUCCESS'
export const UPDATE_RECEIVE_ADDRESS_ERROR = 'UPDATE_RECEIVE_ADDRESS_ERROR'
export const SAVE_RECEIVE_ADDRESS = 'SAVE_RECEIVE_ADDRESS'
export const UPDATE_INPUT_CURRENCY_SELECTED = 'UPDATE_INPUT_CURRENCY_SELECTED'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'

export const updateReceiveAddress = () => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

    const onSuccess = (receiveAddress) => {
      dispatch(updateReceiveAddressSuccess(receiveAddress))
    }
    const onError = (error) => {
      console.log('Core Error', error)
      dispatch(updateReceiveAddressError(error))
    }

    wallet.getReceiveAddress()
    .then(onSuccess)
    .catch(onError)
  }
}

export const updateInputCurrencySelected = inputCurrencySelected => {
  return {
    type: UPDATE_INPUT_CURRENCY_SELECTED,
    data: { inputCurrencySelected }
  }
}

export const saveReceiveAddress = receiveAddress => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

    const onSuccess = () => {
      dispatch(updateReceiveAddress())
    }
    const onError = (error) => {
      console.log('Core Error', error)
    }

    wallet.saveReceiveAddress(receiveAddress)
    .then(onSuccess)
    .catch(onError)
  }
}

export const updateReceiveAddressSuccess = receiveAddress => {
  return {
    type: UPDATE_RECEIVE_ADDRESS_SUCCESS,
    data: { receiveAddress }
  }
}

export const updateReceiveAddressError = (error) => {
  return {
    type: UPDATE_RECEIVE_ADDRESS_ERROR,
    data: { error }
  }
}

export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const updateAmountRequestedInCrypto = (amountRequestedInCrypto) => {
  return {
    type: UPDATE_AMOUNT_REQUESTED_IN_CRYPTO,
    data: { amountRequestedInCrypto }
  }
}

export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'
export const updateAmountReceivedInCrypto = (amountReceivedInCrypto) => {
  return {
    type: UPDATE_AMOUNT_RECEIVED_IN_CRYPTO,
    data: { amountReceivedInCrypto }
  }
}

export const UPDATE_AMOUNT_REQUESTED_IN_FIAT = 'UPDATE_AMOUNT_REQUESTED_IN_FIAT'
export const updateAmountRequestedInFiat = (amountRequestedInFiat) => {
  return {
    type: UPDATE_AMOUNT_REQUESTED_IN_FIAT,
    data: { amountRequestedInFiat }
  }
}

export const UPDATE_METADATA = 'UPDATE_METADATA'
