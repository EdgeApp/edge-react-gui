// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../types/reduxTypes.js'

export type EditTokenState = {
  +editCustomTokenProcessing: boolean
}

const editCustomTokenProcessing = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'EDIT_CUSTOM_TOKEN_START':
      return true

    case 'EDIT_CUSTOM_TOKEN_FAILURE':
    case 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS':
    case 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS':
    case 'UPDATE_EXISTING_TOKEN_SUCCESS':
      return false

    default:
      return state
  }
}

export const editToken: Reducer<EditTokenState, Action> = combineReducers({
  editCustomTokenProcessing
})
