import * as ACTION from './action'
import {combineReducers} from 'redux'

const view = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SIDEBAR :
      return true
    case ACTION.CLOSE_SIDEBAR :
      return false
    default:
      return state
  }
}

const sideMenu = combineReducers({
  view
})

export default sideMenu