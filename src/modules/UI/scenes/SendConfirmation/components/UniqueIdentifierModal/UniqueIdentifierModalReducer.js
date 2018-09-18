// @flow

import type { Action } from '../../../../../ReduxTypes.js'

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
    case 'UNIQUE_IDENTIFIER_MODAL/ACTIVATED': {
      return {
        ...state,
        isActive: true
      }
    }

    case 'UNIQUE_IDENTIFIER_MODAL/DEACTIVATED': {
      return {
        ...state,
        isActive: false
      }
    }

    case 'UNIQUE_IDENTIFIER_MODAL/UNIQUE_IDENTIFIER_CHANGED': {
      return {
        ...state,
        // $FlowFixMe
        uniqueIdentifier: action.data.uniqueIdentifier
      }
    }

    case 'UNIQUE_IDENTIFIER_MODAL/RESET': {
      return initialState
    }

    default:
      return state
  }
}
