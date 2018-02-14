import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'

export const UPDATE_RECEIVE_ADDRESS = 'UPDATE_RECEIVE_ADDRESS'
export const UPDATE_RECEIVE_ADDRESS_START = 'UPDATE_RECEIVE_ADDRESS_START'
export const UPDATE_RECEIVE_ADDRESS_SUCCESS = 'UPDATE_RECEIVE_ADDRESS_SUCCESS'
export const UPDATE_RECEIVE_ADDRESS_ERROR = 'UPDATE_RECEIVE_ADDRESS_ERROR'
export const SAVE_RECEIVE_ADDRESS = 'SAVE_RECEIVE_ADDRESS'
export const UPDATE_INPUT_CURRENCY_SELECTED = 'UPDATE_INPUT_CURRENCY_SELECTED'

export const updateReceiveAddress = (walletId, currencyCode) => (dispatch, getState) => {
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

export const updateInputCurrencySelected = inputCurrencySelected => ({
  type: UPDATE_INPUT_CURRENCY_SELECTED,
  data: { inputCurrencySelected }
})

export const saveReceiveAddress = receiveAddress => (dispatch, getState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  const onSuccess = () => {
    dispatch(updateReceiveAddress())
  }
  const onError = e => {
    console.log(e)
  }

  wallet
    .saveReceiveAddress(receiveAddress)
    .then(onSuccess)
    .catch(onError)
}

export const updateReceiveAddressSuccess = receiveAddress => ({
  type: UPDATE_RECEIVE_ADDRESS_SUCCESS,
  data: { receiveAddress }
})

export const updateReceiveAddressError = error => ({
  type: UPDATE_RECEIVE_ADDRESS_ERROR,
  data: { error }
})

export const UPDATE_AMOUNT_REQUESTED_IN_CRYPTO = 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO'
export const updateAmountRequestedInCrypto = amountRequestedInCrypto => ({
  type: UPDATE_AMOUNT_REQUESTED_IN_CRYPTO,
  data: { amountRequestedInCrypto }
})

export const UPDATE_AMOUNT_RECEIVED_IN_CRYPTO = 'UPDATE_AMOUNT_RECEIVED_IN_CRYPTO'
export const updateAmountReceivedInCrypto = amountReceivedInCrypto => ({
  type: UPDATE_AMOUNT_RECEIVED_IN_CRYPTO,
  data: { amountReceivedInCrypto }
})

export const UPDATE_AMOUNT_REQUESTED_IN_FIAT = 'UPDATE_AMOUNT_REQUESTED_IN_FIAT'
export const updateAmountRequestedInFiat = amountRequestedInFiat => ({
  type: UPDATE_AMOUNT_REQUESTED_IN_FIAT,
  data: { amountRequestedInFiat }
})

export const UPDATE_METADATA = 'UPDATE_METADATA'
