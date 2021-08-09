// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../types/reduxTypes.js'

export type ScanState = {
  +torchEnabled: boolean,
  +scanEnabled: boolean
}

export const scan: Reducer<ScanState, Action> = combineReducers({
  scanEnabled(state = false, action: Action): boolean {
    switch (action.type) {
      case 'ENABLE_SCAN':
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
