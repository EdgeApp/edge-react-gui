// @flow

import { combineReducers } from 'redux'

const view = (state = false, action) => {
  switch (action.type) {
    case 'OPEN_AB_ALERT': {
      return true
    }

    case 'CLOSE_AB_ALERT': {
      return false
    }

    default:
      return state
  }
}

const syntax = (state = {}, action) => {
  switch (action.type) {
    case 'OPEN_AB_ALERT': {
      return action.data
    }

    case 'CLOSE_AB_ALERT': {
      return ''
    }

    default:
      return state
  }
}

export const abAlertReducer = combineReducers({
  view,
  syntax
})

export default abAlertReducer
