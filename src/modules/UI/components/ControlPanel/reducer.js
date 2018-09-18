// @flow

import { combineReducers } from 'redux'

const usersView = (state = false, action) => {
  switch (action.type) {
    case 'OPEN_SELECT_USER': {
      return true
    }

    case 'CLOSE_SELECT_USER': {
      return false
    }

    default:
      return state
  }
}

const selectedUser = (state = null, action) => {
  switch (action.type) {
    case 'LIST_USER_USER_SIDE_MENU': {
      return action.data[0]
    }

    case 'SELECT_USERS_SIDE_MENU': {
      return action.id
    }

    default:
      return state
  }
}

export const controlPanel = combineReducers({
  usersView,
  selectedUser
})

export default controlPanel
