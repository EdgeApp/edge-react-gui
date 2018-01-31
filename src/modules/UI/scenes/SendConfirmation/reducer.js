// @flow
import * as ACTION from './action'
import { type SendConfirmationState, initialState } from './selectors'
import { isEqual } from 'lodash'

export const sendConfirmation = (state: SendConfirmationState = initialState, action: any) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION: {
      const { transaction, parsedUri, forceUpdateGui, error } = data
      let forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      if (!parsedUri) return { ...state, error, transaction }
      const { metadata, customNetworkFee, ...others } = parsedUri
      if (!isEqual(state.parsedUri.metadata, metadata)) {
        state.parsedUri.metadata = { ...state.parsedUri.metadata, ...metadata }
      }
      if (customNetworkFee && !isEqual(state.parsedUri.customNetworkFee, customNetworkFee)) {
        state.parsedUri.customNetworkFee = customNetworkFee
      }

      return {
        ...state,
        transaction,
        forceUpdateGuiCounter,
        error,
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
