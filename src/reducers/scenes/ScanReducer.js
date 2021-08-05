// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../types/reduxTypes.js'
import { type PrivateKeyModalState, privateKeyModal } from '../PrivateKeyModalReducer.js'

export type ScanState = {
  +torchEnabled: boolean,
  +scanEnabled: boolean,
  +privateKeyModal: PrivateKeyModalState
}

export const scan: Reducer<ScanState, Action> = combineReducers({
  privateKeyModal,

  scanEnabled(state = false, action: Action): boolean {
    switch (action.type) {
      case 'ENABLE_SCAN':
      case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL':
      case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS':
        return true
      case 'DISABLE_SCAN':
        return false
    }
    return state
  },

  torchEnabled(state = false, action: Action): boolean {
    return action.type === 'TOGGLE_ENABLE_TORCH' ? !state : state
  }
})
