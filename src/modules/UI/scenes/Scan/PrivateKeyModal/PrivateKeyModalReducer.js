// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../../ReduxTypes.js'
import { primaryModal } from './PrimaryModal/PrimaryModalReducer.js'
import { secondaryModal } from './SecondaryModal/SecondaryModalReducer.js'

const initialIsSweepingState = false
type IsSweepingState = boolean
export const isSweeping = (state: IsSweepingState = initialIsSweepingState, action: Action) => {
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
type ErrorState = Error | null
export const error = (state: ErrorState = initialErrorState, action: Action) => {
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

export const privateKeyModal = combineReducers({
  primaryModal,
  secondaryModal,
  error,
  isSweeping
})

export default privateKeyModal
