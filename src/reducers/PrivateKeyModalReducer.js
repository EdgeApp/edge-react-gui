// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'
import { secondaryModal } from './SecondaryModalReducer.js'

export type PrivateKeyModalState = {
  secondaryModal: {
    isActive: boolean
  },
  error: Error | null,
  isSweeping: boolean
}

const isSweeping = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START': {
      return true
    }

    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL':
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS': {
      return false
    }

    default:
      return state
  }
}

const error = (state = null, action: Action): Error | null => {
  switch (action.type) {
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL': {
      return action.data.error
    }

    default:
      return state
  }
}

export const privateKeyModal: Reducer<PrivateKeyModalState, Action> = combineReducers({
  secondaryModal,
  error,
  isSweeping
})
