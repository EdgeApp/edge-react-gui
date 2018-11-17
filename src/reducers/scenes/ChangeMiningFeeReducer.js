// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'

export type ChangeMiningFeeState = {
  isCustomFeeVisible: boolean
}

const isCustomFeeVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_CUSTOM_FEES_MODAL': {
      return true
    }

    case 'CLOSE_CUSTOM_FEES_MODAL': {
      return false
    }

    default:
      return state
  }
}

export const changeMiningFee: Reducer<ChangeMiningFeeState, Action> = combineReducers({
  isCustomFeeVisible
})
