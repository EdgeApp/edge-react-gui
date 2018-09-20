// @flow

import { combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

const usersView = (state = false, action: Action) => {
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

const selectedUser = (state = null, action: Action) => {
  switch (action.type) {
    case 'LIST_USER_USER_SIDE_MENU': {
      if (!action.data) throw new Error('Invalid action')
      return action.data[0]
    }

    case 'SELECT_USERS_SIDE_MENU': {
      // $FlowFixMe
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
