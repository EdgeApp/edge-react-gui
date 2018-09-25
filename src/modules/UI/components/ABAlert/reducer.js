// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

export type ABAlertState = {
  view: boolean,
  route: string, // MISSING!
  syntax: {
    title: string,
    message: string,
    buttons: Array<{ title: string, message: string }>
  }
}

const view = (state = false, action: Action): boolean => {
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

const syntax = (state = {}, action: Action): $PropertyType<ABAlertState, 'syntax'> => {
  switch (action.type) {
    case 'OPEN_AB_ALERT': {
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data
    }

    case 'CLOSE_AB_ALERT': {
      // $FlowFixMe
      return ''
    }

    default:
      // $FlowFixMe
      return state
  }
}

// $FlowFixMe
export const ABAlert: Reducer<ABAlertState, Action> = combineReducers({
  // route,
  syntax,
  view
})
