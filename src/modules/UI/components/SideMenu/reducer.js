/* eslint-disable flowtype/require-valid-file-annotation */

import { combineReducers } from 'redux'

import * as ACTION from './action'

const view = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SIDE_MENU:
      return true
    case ACTION.CLOSE_SIDE_MENU:
      return false
    default:
      return state
  }
}

export const sideMenu = combineReducers({
  view
})

export default sideMenu
