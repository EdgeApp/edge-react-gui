// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

export type ErrorAlertState = {
  displayAlert: boolean,
  message: string
}

const displayAlert = (state = false, action = {}): boolean => {
  switch (action.type) {
    case 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT':
      return true
    case 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT':
      return false
    default:
      return state
  }
}

const message = (state = '', action = {}): string => {
  switch (action.type) {
    case 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT':
      return action.data.message
    case 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT':
      return ''
    default:
      return state
  }
}

export const errorAlert: Reducer<ErrorAlertState, Action> = combineReducers({
  displayAlert,
  message
})
