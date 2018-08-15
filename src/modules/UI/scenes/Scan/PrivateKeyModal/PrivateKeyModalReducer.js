// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../../ReduxTypes.js'
import { primaryModal } from './PrimaryModal/PrimaryModalReducer.js'
import { SWEEP_PRIVATE_KEY_FAIL, SWEEP_PRIVATE_KEY_RESET, SWEEP_PRIVATE_KEY_START, SWEEP_PRIVATE_KEY_SUCCESS } from './PrivateKeyModalActions.js'
import { secondaryModal } from './SecondaryModal/SecondaryModalReducer.js'

const initialIsSweepingState = false
type IsSweepingState = boolean
export const isSweeping = (state: IsSweepingState = initialIsSweepingState, action: Action) => {
  switch (action.type) {
    case SWEEP_PRIVATE_KEY_START: {
      return true
    }
    case SWEEP_PRIVATE_KEY_FAIL:
    case SWEEP_PRIVATE_KEY_SUCCESS: {
      return false
    }
    case SWEEP_PRIVATE_KEY_RESET: {
      return initialIsSweepingState
    }
    default:
      return state
  }
}

const initialErrorState = null
type ErrorState = Error | null
export const error = (state: ErrorState = initialErrorState, action: Action) => {
  switch (action.type) {
    case SWEEP_PRIVATE_KEY_FAIL: {
      // $FlowFixMe
      return action.data.error
    }
    case SWEEP_PRIVATE_KEY_RESET: {
      return initialErrorState
    }
    default:
      return state
  }
}

export const privateKeyModal = combineReducers({
  primaryModal,
  secondaryModal,
  error,
  isSweeping
})

export default privateKeyModal
