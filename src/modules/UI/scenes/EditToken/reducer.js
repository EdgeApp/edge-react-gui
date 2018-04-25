// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as WALLET_ACTIONS from '../../Wallets/action'
import * as ACTION from './action'

export const deleteTokenModalVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.SHOW_DELETE_TOKEN_MODAL:
      return true
    case ACTION.HIDE_DELETE_TOKEN_MODAL:
      return false
    case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_SUCCESS:
      return false
    default:
      return state
  }
}

export const deleteCustomTokenProcessing = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_START:
      return true
    case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_SUCCESS:
      return false
    case WALLET_ACTIONS.DELETE_CUSTOM_TOKEN_FAILURE:
      return false
    default:
      return state
  }
}

export const editCustomTokenProcessing = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case WALLET_ACTIONS.EDIT_CUSTOM_TOKEN_START:
      return true
    case WALLET_ACTIONS.EDIT_CUSTOM_TOKEN_SUCCESS:
      return false
    case WALLET_ACTIONS.EDIT_CUSTOM_TOKEN_FAILURE:
      return false
    case WALLET_ACTIONS.ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS:
      return false
    case WALLET_ACTIONS.OVERWRITE_THEN_DELETE_TOKEN_SUCCESS:
      return false
    case WALLET_ACTIONS.UPDATE_EXISTING_TOKEN_SUCCESS:
      return false
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
