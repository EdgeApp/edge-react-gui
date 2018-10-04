// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action, type Username } from '../../../ReduxTypes.js'

export type ControlPanelState = {
  +usersView: boolean,
  +selectedUser: Username | null
}

const usersView = (state = false, action: Action): boolean => {
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

const selectedUser = (state = null, action: Action): Username | null => {
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

export const controlPanel: Reducer<ControlPanelState, Action> = combineReducers({
  usersView,
  selectedUser
})
