// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

const isCustomFeeVisible = (state: boolean = false, action: Action) => {
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

export const changeMiningFee = combineReducers({
  isCustomFeeVisible
})

export default changeMiningFee
