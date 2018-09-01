// @flow

import type { Action } from '../../../../../ReduxTypes.js'
import { ACTIVATED, DEACTIVATED, RESET, UNIQUE_IDENTIFIER_CHANGED } from './UniqueIdentifierModalActions.js'

export type State = {
  isActive: boolean,
  uniqueIdentifier: string
}
export const initialState = {
  isActive: false,
  uniqueIdentifier: ''
}
export const UniqueIdentifierModalReducer = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ACTIVATED: {
      return {
        ...state,
        isActive: true
      }
    }
    case DEACTIVATED: {
      return {
        ...state,
        isActive: false
      }
    }
    case UNIQUE_IDENTIFIER_CHANGED: {
      return {
        ...state,
        // $FlowFixMe
        uniqueIdentifier: action.data.uniqueIdentifier
      }
    }
    case RESET: {
      return initialState
    }
    default:
      return state
  }
}
