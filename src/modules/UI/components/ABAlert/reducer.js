// @flow

import { combineReducers } from 'redux'

import * as Constants from '../../../../constants/indexConstants'

const view = (state = false, action) => {
  switch (action.type) {
    case Constants.OPEN_AB_ALERT:
      return true
    case Constants.CLOSE_AB_ALERT:
      return false
    default:
      return state
  }
}

const syntax = (state = {}, action) => {
  switch (action.type) {
    case Constants.OPEN_AB_ALERT:
      return action.data
    case Constants.CLOSE_AB_ALERT:
      return ''
    default:
      return state
  }
}

export const abAlertReducer = combineReducers({
  view,
  syntax
})

export default abAlertReducer
