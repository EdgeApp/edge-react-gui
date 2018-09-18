// @flow

import { combineReducers } from 'redux'

const displayAlert = (state = false, action = {}) => {
  const { type } = action
  switch (type) {
    case 'UI/components/ErrorAlert/DISPLAY_ERROR_ALERT':
      return true
    case 'UI/components/ErrorAlert/DISMISS_ERROR_ALERT':
      return false
    default:
      return state
  }
}

const message = (state = '', action = {}) => {
  const { type, data = {} } = action
  switch (type) {
    case 'UI/components/ErrorAlert/DISPLAY_ERROR_ALERT':
      return data.message
    case 'UI/components/ErrorAlert/DISMISS_ERROR_ALERT':
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
