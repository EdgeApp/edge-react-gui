// @flow

import { isEqual } from 'lodash'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from './action'
import { initialState } from './selectors'
import type { SendConfirmationState } from './selectors'

export const sendConfirmation = (state: SendConfirmationState = initialState, action: Action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION: {
      const { transaction, parsedUri, forceUpdateGui, error } = data
      let forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      if (!parsedUri) return { ...state, forceUpdateGuiCounter, error, transaction }
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
