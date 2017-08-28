import * as ACTION from './action'
import { combineReducers } from 'redux'

const view = (state = false, action) => {
  switch (action.type) {
  case ACTION.OPEN_AB_ALERT :
    return true
  case ACTION.CLOSE_AB_ALERT :
    return false
  default:
    return state
  }
}

const syntax = (state = {}, action) => {
  switch (action.type) {
  case ACTION.OPEN_AB_ALERT :
    return action.data.syntax
  case ACTION.CLOSE_AB_ALERT :
    return ''
  default:
    return state
  }
}

export default combineReducers({
  view,
  syntax
  // route
})
