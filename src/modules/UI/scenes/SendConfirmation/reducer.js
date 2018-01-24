// @flow
import * as ACTION from './action'
import * as Constants from '../../../../constants/indexConstants'
import type { AbcTransaction, AbcParsedUri } from 'airbitz-core-types'

export type SendConfirmationState = {
  transaction: AbcTransaction | null,
  parsedUri: AbcParsedUri,
  error: Error | null,
  displayAmount: number,
  publicAddress: string,
  label: string,
  networkFeeOption: string,
  customNetworkFee?: any,
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
    nativeAmount: '',
    metadata: {}
  },
  error: null,
  displayAmount: 0,
  publicAddress: '',
  label: '',
  networkFeeOption: Constants.STANDARD_FEE,
  customNetworkFee: {},
  inputCurrencySelected: 'fiat',
  maxSatoshi: 0,
  isPinEnabled: false,
  isSliderLocked: false,
  draftStatus: 'under',
  isKeyboardVisible: false,
  pending: false
}

export const sendConfirmation = (state: SendConfirmationState = initialState, action: any) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION: {
      const { transaction } = data
      return {
        ...state,
        transaction
      }
    }
    case ACTION.UPDATE_TRANSACTION_ERROR: {
      const {error} = data
      return {
        ...state,
        error
      }
    }
    case ACTION.UPDATE_PARSED_URI: {
      const {parsedUri = {}} = data
      const {publicAddress} = parsedUri
      return {
        ...state,
        parsedUri,
        publicAddress
      }
    }
    case ACTION.UPDATE_DISPLAY_AMOUNT: {
      const { displayAmount } = data
      return {
        ...state,
        displayAmount
      }
    }
    case ACTION.UPDATE_MAX_SATOSHI: {
      const { maxSatoshi } = data
      return {
        ...state,
        maxSatoshi
      }
    }
    case ACTION.USE_MAX_SATOSHI: {
      const { maxSatoshi } = data
      return {
        ...state,
        maxSatoshi
      }
    }
    case ACTION.UNLOCK_SLIDER: {
      const { isSliderLocked } = data
      return {
        ...state,
        isSliderLocked
      }
    }
    case ACTION.UPDATE_DRAFT_STATUS: {
      const { draftStatus } = data
      return {
        ...state,
        draftStatus
      }
    }
    case ACTION.UPDATE_IS_KEYBOARD_VISIBLE: {
      const { isKeyboardVisible } = data
      return {
        ...state,
        isKeyboardVisible
      }
    }
    case ACTION.UPDATE_SPEND_PENDING: {
      const { pending } = data
      return {
        ...state,
        pending
      }
    }
    case ACTION.RESET: {
      return initialState
    }
    case ACTION.UPDATE_PARSED_URI_NATIVE_AMOUNT: {
      const {nativeAmount} = data
      const parsedUri = { ...state.parsedUri, nativeAmount }
      return {
        ...state,
        parsedUri
      }
    }
    case ACTION.UPDATE_PARSED_URI_METADATA: {
      const {metadata} = data
      const parsedUri = { ...state.parsedUri, metadata }
      return {
        ...state,
        parsedUri
      }
    }
    case ACTION.CHANGE_MINING_FEE:
      const {networkFeeOption, customNetworkFee} = data
      if (!customNetworkFee) return { ...state, networkFeeOption }
      return {
        ...state,
        networkFeeOption,
        customNetworkFee
      }
    default:
      return state
  }
}

export default sendConfirmation
