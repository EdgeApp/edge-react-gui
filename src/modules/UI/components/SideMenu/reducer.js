import * as ACTION from './action'
import { combineReducers } from 'redux'

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
