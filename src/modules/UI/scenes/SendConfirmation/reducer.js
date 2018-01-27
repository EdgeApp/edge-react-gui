// @flow
import * as ACTION from './action'
import { type SendConfirmationState, initialState } from './selectors'
import { isEqual } from 'lodash'

export const sendConfirmation = (state: SendConfirmationState = initialState, action: any) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION: {
      const { transaction, error } = data
      return {
        ...state,
        transaction,
        error
      }
    }
    case ACTION.UPDATE_PARSED_URI: {
      const { parsedUri } = data
      if (!parsedUri) return { ...state }
      const { metadata, customNetworkFee, ...others } = parsedUri
      if (!isEqual(state.parsedUri.metadata, metadata)) {
        state.parsedUri.metadata = { ...state.parsedUri.metadata, ...metadata }
      }
      if (customNetworkFee && !isEqual(state.parsedUri.customNetworkFee, customNetworkFee)) {
        state.parsedUri.customNetworkFee = customNetworkFee
      }

      return {
        ...state,
        parsedUri: {
          ...state.parsedUri,
          ...others
        }
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
    default:
      return state
  }
}

export default sendConfirmation
