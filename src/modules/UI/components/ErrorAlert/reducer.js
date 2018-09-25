// @flow

import { combineReducers } from 'redux'

const displayAlert = (state = false, action = {}) => {
  switch (action.type) {
    case 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT':
      return true
    case 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT':
      return false
    default:
      return state
  }
}

const message = (state = '', action = {}) => {
  switch (action.type) {
    case 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT':
      return action.data.message
    case 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT':
      return ''
    default:
      return state
  }
}

export const errorAlert = combineReducers({
  displayAlert,
  message
})

export default errorAlert
