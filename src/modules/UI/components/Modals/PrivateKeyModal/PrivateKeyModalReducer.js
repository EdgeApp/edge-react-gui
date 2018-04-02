// @flow

import type { Action } from '../../../../ReduxTypes.js'

import { PRIVATE_KEY_SCANNED, SWEEP_PRIVATE_KEY_START, SWEEP_PRIVATE_KEY_SUCCESS, SWEEP_PRIVATE_KEY_FAIL, DISMISS_MODAL, RESET } from './indexPrivateKeyModal.js'

const initialState = {
  isThinking: false,
  isPrimaryModalVisible: false,
  isSecondaryModalVisible: false,
  publicAddress: null,
  error: null
}

type InitialState = {
  isThinking: false,
  isPrimaryModalVisible: false,
  isSecondaryModalVisible: false,
  publicAddress: null,
  error: null
}
type PrimaryModalVisible = {
  isThinking: false,
  isPrimaryModalVisible: true,
  isSecondaryModalVisible: false,
  publicAddress: string,
  error: null
}
type SecondaryModalVisible = {
  isThinking: boolean,
  isPrimaryModalVisible: false,
  isSecondaryModalVisible: true,
  publicAddress: string,
  error: Error | null
}
export type State = InitialState | PrimaryModalVisible | SecondaryModalVisible
export const PrivateKeyModalReducer = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case PRIVATE_KEY_SCANNED: {
      return {
        ...state,
        isPrimaryModalVisible: true,
        // $FlowFixMe
        publicAddress: action.data.parsedUri.publicAddress
      }
    }
    case SWEEP_PRIVATE_KEY_START: {
      return {
        ...state,
        isPrimaryModalVisible: false,
        isSecondaryModalVisible: true,
        isThinking: true
      }
    }
    case SWEEP_PRIVATE_KEY_FAIL: {
      return {
        ...state,
        isThinking: false,
        // $FlowFixMe
        error: action.data.error
      }
    }
    case SWEEP_PRIVATE_KEY_SUCCESS: {
      return {
        ...state,
        isThinking: false
      }
    }
    case DISMISS_MODAL: {
      return {
        ...state,
        isPrimaryModalVisible: false,
        isSecondaryModalVisible: false
      }
    }
    case RESET: {
      return initialState
    }

    default:
      return state
  }
}
