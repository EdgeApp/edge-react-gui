// @flow

import { add } from 'biggystring'
import type { EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import { isEqual } from 'lodash'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from './action'
import { initialState } from './selectors'
import type { SendConfirmationState } from './selectors.js'

export const sendConfirmationLegacy = (state: SendConfirmationState = initialState, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_TRANSACTION: {
      if (!action.data) throw new Error('Invalid Action')
      const { parsedUri, forceUpdateGui } = action.data
      let forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      if (!parsedUri) return { ...state, forceUpdateGuiCounter }

      const { metadata = {}, customNetworkFee, ...others } = parsedUri
      if (!isEqual(state.parsedUri.metadata, metadata)) {
        state.parsedUri.metadata = { ...state.parsedUri.metadata, ...metadata }
      }

      if (customNetworkFee && !isEqual(state.parsedUri.customNetworkFee, customNetworkFee)) {
        state.parsedUri.customNetworkFee = customNetworkFee
      }

      return {
        ...state,
        forceUpdateGuiCounter,
        parsedUri: {
          ...state.parsedUri,
          ...others
        }
      }
    }

    default:
      return state
  }
}

export const nativeAmount = (state: string = '0', action: Action) => {
  switch (action.type) {
    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) throw new Error('Invalid Action')
      const nativeAmount = action.data.spendInfo.nativeAmount || action.data.spendInfo.spendTargets.reduce((sum, target) => add(sum, target.nativeAmount), '0')
      return nativeAmount
    }
    case ACTION.UPDATE_TRANSACTION: {
      if (!action.data) throw new Error('Invalid Action')
      if (!action.data.parsedUri) return state
      return action.data.parsedUri.nativeAmount || state.nativeAmount || '0'
    }
    default:
      return state
  }
}

export const spendInfo = (state: EdgeSpendInfo | null = null, action: Action) => {
  switch (action.type) {
    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo
    }
    default:
      return state
  }
}

export const address = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo.spendTargets[0].publicAddress
    }
    default:
      return state
  }
}

export const authRequired = (state: 'none' | 'pin' = 'none', action: Action) => {
  switch (action.type) {
    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.authRequired || 'none'
    }
    default:
      return state
  }
}

export const destination = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_TRANSACTION: {
      if (!action.data) throw new Error('Invalid Action')
      if (!action.data.parsedUri || !action.data.parsedUri.metadata || !action.data.parsedUri.metadata.name) return state

      return action.data.parsedUri.metadata.name
    }
    case ACTION.NEW_SPEND_INFO: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.spendInfo.metadata.name || ''
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
    case ACTION.NEW_SPEND_INFO: {
      return null
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

export const transaction = (state: EdgeTransaction | null = null, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_PAYMENT_PROTOCOL_TRANSACTION:
    case ACTION.UPDATE_TRANSACTION: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.transaction
    }
    case ACTION.NEW_SPEND_INFO: {
      return null
    }
    default:
      return state
  }
}

export const isKeyboardVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_IS_KEYBOARD_VISIBLE: {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.isKeyboardVisible
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
    pending: pending(state.pending, action),
    transaction: transaction(state.transaction, action),
    isKeyboardVisible: isKeyboardVisible(state.isKeyboardVisible, action),
    destination: destination(state.destination, action),
    spendInfo: spendInfo(state.spendInfo, action),
    nativeAmount: nativeAmount(state.nativeAmount, action),
    address: address(state.address, action),
    authRequired: authRequired(state.authRequired, action)
  }
}
export default sendConfirmation
