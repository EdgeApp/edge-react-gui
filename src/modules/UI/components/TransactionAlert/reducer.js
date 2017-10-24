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
  const {type, data: {abcTransaction} = {} } = action
  switch (type) {
  case ACTIONS.DISPLAY_TRANSACTION_ALERT:
    return abcTransaction
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
