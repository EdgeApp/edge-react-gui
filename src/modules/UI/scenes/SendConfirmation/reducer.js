// @flow
import * as ACTION from './action'
import type {AbcTransaction, AbcParsedUri} from 'airbitz-core-types'

export type SendConfirmationState = {
  transaction: AbcTransaction | null,
  parsedUri: AbcParsedUri,
  error: Error | null,

  displayAmount: number,
  publicAddress: string,
  feeSatoshi: number,
  label: string,

  inputCurrencySelected: string,
  maxSatoshi: number,
  isPinEnabled: boolean,
  isSliderLocked: boolean,
  draftStatus: string,
  isKeyboardVisible: boolean,
  pending: boolean
}

export const initialState: SendConfirmationState = {
  transaction: null,
  parsedUri: {
    publicAddress: '',
    nativeAmount: ''
  },
  error: null,

  displayAmount: 0,
  publicAddress: '',
  feeSatoshi: 0,
  label: '',

  inputCurrencySelected: 'fiat',
  maxSatoshi: 0,
  isPinEnabled: false,
  isSliderLocked: false,
  draftStatus: 'under',
  isKeyboardVisible: false,
  pending: false
}

const sendConfirmation = (state: SendConfirmationState = initialState, action: any) => {
  const {type, data = {} } = action
  switch (type) {
  case ACTION.UPDATE_TRANSACTION: {
    const transaction: AbcTransaction = data.transaction
    const parsedUri: AbcParsedUri = data.parsedUri
    const error: Error = data.error
    const out: SendConfirmationState = {
      ...state,
      transaction,
      parsedUri,
      error
    }
    return out
  }
  case ACTION.UPDATE_PARSED_URI: {
    const {parsedUri = {} } = data
    const publicAddress = parsedUri.publicAddress
    return {
      ...state,
      parsedUri,
      publicAddress
    }
  }
  case ACTION.UPDATE_DISPLAY_AMOUNT: {
    const {displayAmount} = data
    return {
      ...state,
      displayAmount
    }
  }
  // case ACTION.UPDATE_INPUT_CURRENCY_SELECTED: {
  //   const {inputCurrencySelected} = data
  //   return {
  //     ...state,
  //     inputCurrencySelected
  //   }
  // }
  case ACTION.UPDATE_MAX_SATOSHI: {
    const {maxSatoshi} = data
    return {
      ...state,
      maxSatoshi
    }
  }
  case ACTION.USE_MAX_SATOSHI: {
    const {maxSatoshi} = data
    return {
      ...state,
      maxSatoshi
    }
  }
  case ACTION.UNLOCK_SLIDER: {
    const {isSliderLocked} = data
    return {
      ...state,
      isSliderLocked
    }
  }
  case ACTION.UPDATE_DRAFT_STATUS: {
    const {draftStatus} = data
    return {
      ...state,
      draftStatus
    }
  }
  case ACTION.UPDATE_IS_KEYBOARD_VISIBLE: {
    const {isKeyboardVisible} = data
    return {
      ...state,
      isKeyboardVisible
    }
  }
  case ACTION.UPDATE_SPEND_PENDING: {
    const {pending} = data
    return {
      ...state,
      pending
    }
  }
  case ACTION.RESET: {
    return initialState
  }
  case ACTION.UPDATE_NATIVE_AMOUNT: {
    const {nativeAmount} = data
    return {
      ...state,
      parsedUri: {
        ...state.parsedUri,
        nativeAmount
      }
    }
  }
  default:
    return state
  }
}

export default sendConfirmation
