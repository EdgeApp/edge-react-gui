// @flow

import { combineReducers } from 'redux'

import * as ACTION from './action'

const usersView = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SELECT_USER:
      return true
    case ACTION.CLOSE_SELECT_USER:
      return false
    default:
      return state
  }
}

const selectedUser = (state = null, action) => {
  switch (action.type) {
    case ACTION.LIST_USERS_SIDE_MENU:
      return action.data[0]
    case ACTION.SELECT_USERS_SIDE_MENU:
      return action.id
    default:
      return state
  }
}

export const controlPanel = combineReducers({
  usersView,
  selectedUser
})

export default controlPanel
