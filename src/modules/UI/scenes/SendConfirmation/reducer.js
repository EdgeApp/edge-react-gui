// @flow

import { add } from 'biggystring'
import { isEqual } from 'lodash'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from './action'
import { initialState } from './selectors'
import type { SendConfirmationState } from './selectors'

export const sendConfirmationLegacy = (state: SendConfirmationState = initialState, action: Action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_TRANSACTION: {
      const { transaction, parsedUri, forceUpdateGui } = data
      let forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      if (!parsedUri) return { ...state, forceUpdateGuiCounter, transaction }

      const { metadata = {}, customNetworkFee, ...others } = parsedUri
      if (!isEqual(state.parsedUri.metadata, metadata)) {
        state.parsedUri.metadata = { ...state.parsedUri.metadata, ...metadata }
      }

      if (customNetworkFee && !isEqual(state.parsedUri.customNetworkFee, customNetworkFee)) {
        state.parsedUri.customNetworkFee = customNetworkFee
      }

      const nativeAmount = parsedUri.nativeAmount || state.nativeAmount || '0'
      const destination = metadata.name || parsedUri.legacyAddress || parsedUri.publicAddress || state.destination

      return {
        ...state,
        transaction,
        forceUpdateGuiCounter,
        nativeAmount,
        destination,
        parsedUri: {
          ...state.parsedUri,
          ...others
        }
      }
    }

    case ACTION.UPDATE_PAYMENT_PROTOCOL_TRANSACTION: {
      if (!action.data) return state
      const { transaction } = data

      return {
        ...state,
        transaction
      }
    }

    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) return state
      const { spendInfo, spendInfo: { metadata: { name } }, authRequired } = data
      const nativeAmount = spendInfo.nativeAmount || spendInfo.spendTargets.reduce((sum, target) => add(sum, target.nativeAmount), '0')
      const destination = name || spendInfo.spendTargets[0].publicAddress
      return {
        ...state,
        spendInfo,
        destination,
        nativeAmount,
        transaction: null,
        authRequired
      }
    }

    case ACTION.UPDATE_IS_KEYBOARD_VISIBLE: {
      const { isKeyboardVisible } = data
      return {
        ...state,
        isKeyboardVisible
      }
    }

    default:
      return state
  }
}

export const error = (state: Error | null = null, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_TRANSACTION:
    case ACTION.MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.error
    }

    default:
      return state
  }
}

export const isEditable = (state: boolean = true, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_PAYMENT_PROTOCOL_TRANSACTION:
    case ACTION.MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED: {
      if (!action.data) throw new Error('Invalid Action')
      return false
    }

    default:
      return state
  }
}

export const pin = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.NEW_PIN: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.pin
    }
    default:
      return state
  }
}

export const pending = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_SPEND_PENDING: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.pending
    }
    default:
      return state
  }
}

export const sendConfirmation = (state: SendConfirmationState = initialState, action: Action) => {
  if (action.type === ACTION.RESET) return initialState

  return {
    ...sendConfirmationLegacy(state, action),
    isEditable: isEditable(state.isEditable, action),
    error: error(state.error, action),
    pin: pin(state.pin, action),
    pending: pending(state.pending, action)
  }
}
export default sendConfirmation
