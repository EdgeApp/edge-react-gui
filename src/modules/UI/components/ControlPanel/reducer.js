// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

export type ControlPanelState = {
  +usersView: boolean
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

export const controlPanel: Reducer<ControlPanelState, Action> = combineReducers({
  usersView
})
