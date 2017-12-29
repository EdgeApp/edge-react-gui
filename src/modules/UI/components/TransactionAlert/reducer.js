// @flow

import * as ACTIONS from './actions'
import {combineReducers} from 'redux'

const displayAlert = (state = false, action = {}) => {
  const {type} = action
  switch (type) {
  case ACTIONS.DISPLAY_TRANSACTION_ALERT:
    return true
  case ACTIONS.DISMISS_TRANSACTION_ALERT:
    return false
  default:
    return state
  }
}

const abcTransaction = (state = '', action = {}) => {
  switch (action.type) {
  case ACTIONS.DISPLAY_TRANSACTION_ALERT:
    if (action.data) {
      return action.data.abcTransaction
    }
    return state
  case ACTIONS.DISMISS_TRANSACTION_ALERT:
    return ''
  default:
    return state
  }
}

export default combineReducers({
  displayAlert,
  abcTransaction
})
