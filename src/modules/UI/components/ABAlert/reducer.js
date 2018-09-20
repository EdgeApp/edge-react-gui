// @flow

import { combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

const view = (state = false, action: Action) => {
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

const syntax = (state = {}, action: Action) => {
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
