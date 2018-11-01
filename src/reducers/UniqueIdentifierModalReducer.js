// @flow

import { type Reducer } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'

export type UniqueIdentifierModalState = {
  isActive: boolean,
  uniqueIdentifier: string
}
export const initialState = {
  isActive: false,
  uniqueIdentifier: ''
}
export const uniqueIdentifierModal: Reducer<UniqueIdentifierModalState, Action> = (state = initialState, action) => {
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
