// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'

export type EditTokenState = {
  +deleteTokenModalVisible: boolean,
  +deleteCustomTokenProcessing: boolean,
  +editCustomTokenProcessing: boolean
}

const deleteTokenModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'SHOW_DELETE_TOKEN_MODAL': {
      return true
    }

    case 'HIDE_DELETE_TOKEN_MODAL': {
      return false
    }

    case 'DELETE_CUSTOM_TOKEN_SUCCESS': {
      return false
    }

    default:
      return state
  }
}

const deleteCustomTokenProcessing = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'DELETE_CUSTOM_TOKEN_START': {
      return true
    }

    case 'DELETE_CUSTOM_TOKEN_SUCCESS': {
      return false
    }

    case 'DELETE_CUSTOM_TOKEN_FAILURE': {
      return false
    }

    default:
      return state
  }
}

const editCustomTokenProcessing = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'EDIT_CUSTOM_TOKEN_START': {
      return true
    }

    case 'EDIT_CUSTOM_TOKEN_SUCCESS': {
      return false
    }

    case 'EDIT_CUSTOM_TOKEN_FAILURE': {
      return false
    }

    case 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS': {
      return false
    }

    case 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS': {
      return false
    }

    case 'UPDATE_EXISTING_TOKEN_SUCCESS': {
      return false
    }

    default:
      return state
  }
}

export const editToken: Reducer<EditTokenState, Action> = combineReducers({
  deleteTokenModalVisible,
  deleteCustomTokenProcessing,
  editCustomTokenProcessing
})
