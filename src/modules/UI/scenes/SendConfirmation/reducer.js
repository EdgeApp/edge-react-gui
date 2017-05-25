import * as ACTION from './action'
import { combineReducers } from 'redux'

const initialState = {
  amountRequestedInCrypto: 0,
  amountRequestedInFiat: 0,
  amountReceivedInCrypto: 0,
  fiatPerCrypto: 0,
  publicAddress: '',
  inputCurrencySelected: 'crypto',
  label: '',
  maxAvailableToSpendInCrypto: 0,
  isPinEnabled: true,
  isSliderEnabled: false,
  draftStatus: 'over',
  isKeyboardVisible: false,
  uri: ''
}

export const sendConfirmation = (state = initialState, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_URI_SUCCESS:
      console.log('UPDATE_URI_SUCCESS')
      const { uri } = data
      return {
        ...state,
        uri
      }
    case ACTION.SET_AMOUNT_REQUESTED_IN_CRYPTO:
      const { amountRequestedInCrypto } = data
      return {
        ...state,
        amountRequestedInCrypto
      }
    case ACTION.SET_AMOUNT_REQUESTED_IN_FIAT:
      const { amountRequestedInFiat } = data
      return {
        ...state,
        amountRequestedInFiat
      }
    case ACTION.SET_AMOUNT_RECEIVED_IN_CRYPTO:
      const { amountReceivedInCrypto } = data
      return {
        ...state,
        amountReceivedInCrypto
      }
    case ACTION.SET_FIAT_PER_CRYPTO:
      const { fiatPerCrypto } = data
      return {
        ...state,
        fiatPerCrypto
      }
    case ACTION.SET_PUBLIC_ADDRESS:
      const { publicAddress } = data
      return {
        ...state,
        publicAddress
      }
    case ACTION.SET_INPUT_CURRENCY_SELECTED:
      const { inputCurrencySelected } = data
      return {
        ...state,
        inputCurrencySelected
      }
    case ACTION.SET_LABEL:
      const { label } = data
      return {
        ...state,
        label
      }
    case ACTION.SET_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO:
      const { maxAvailableToSpendInCrypto } = data
      return {
        ...state,
        maxAvailableToSpendInCrypto
      }
    case ACTION.SET_IS_PIN_ENABLED:
      const { isPinEnabled } = data
      return {
        ...state,
        isPinEnabled
      }
    case ACTION.SET_IS_SLIDER_ENABLED:
      const { isSliderEnabled } = data
      return {
        ...state,
        isSliderEnabled
      }
    case ACTION.SET_DRAFT_STATUS:
      const { draftStatus } = data
      return {
        ...state,
        draftStatus
      }
    case ACTION.SET_IS_KEYBOARD_VISIBLE:
      const { isKeyboardVisible } = data
      return {
        ...state,
        isKeyboardVisible
      }
    default:
      return state
  }
}
