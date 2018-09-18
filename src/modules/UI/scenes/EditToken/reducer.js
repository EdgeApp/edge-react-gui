// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export const deleteTokenModalVisible = (state: boolean = false, action: Action) => {
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

export const deleteCustomTokenProcessing = (state: boolean = false, action: Action) => {
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

export const editCustomTokenProcessing = (state: boolean = false, action: Action) => {
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

export const editToken = combineReducers({
  deleteTokenModalVisible,
  deleteCustomTokenProcessing,
  editCustomTokenProcessing
})

export default editToken
