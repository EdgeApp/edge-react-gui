// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'
import { primaryModal } from './PrimaryModalReducer.js'
import { secondaryModal } from './SecondaryModalReducer.js'

export type PrivateKeyModalState = {
  primaryModal: {
    isActive: boolean
  },
  secondaryModal: {
    isActive: boolean
  },
  error: Error | null,
  isSweeping: boolean
}

const initialIsSweepingState = false
const isSweeping = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START': {
      return true
    }

    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL':
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS': {
      return false
    }

    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_RESET': {
      return initialIsSweepingState
    }

    default:
      return state
  }
}

const initialErrorState = null
const error = (state = null, action: Action): Error | null => {
  switch (action.type) {
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL': {
      // $FlowFixMe
      return action.data.error
    }

    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_RESET': {
      return initialErrorState
    }

    default:
      return state
  }
}

export const privateKeyModal: Reducer<PrivateKeyModalState, Action> = combineReducers({
  primaryModal,
  secondaryModal,
  error,
  isSweeping
})
