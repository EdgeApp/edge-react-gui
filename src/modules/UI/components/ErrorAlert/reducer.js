// @flow
import * as ACTIONS from './actions'
import {combineReducers} from 'redux'

const displayAlert = (state = false, action = {}) => {
  const {type} = action
  switch (type) {
  case ACTIONS.DISPLAY_ERROR_ALERT:
    return true
  case ACTIONS.DISMISS_ERROR_ALERT:
    return false
  default:
    return state
  }
}

const message = (state = '', action = {}) => {
  const {type, data = {} } = action
  switch (type) {
  case ACTIONS.DISPLAY_ERROR_ALERT:
    return data.message
  case ACTIONS.DISMISS_ERROR_ALERT:
    return ''
  default:
    return state
  }
}

export default combineReducers({
  displayAlert,
  message
})
