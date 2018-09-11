// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../../../src/modules/ReduxTypes.js'
import * as ACTION from './action.js'

export const isSetCustomNodesModalVisible = (state: boolean = false, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.SET_CUSTOM_NODES_MODAL_VISIBILITY:
      return action.data.isSetCustomNodesModalVisible
    case ACTION.UPDATE_CUSTOM_NODES_LIST:
      return false
    case ACTION.SET_ENABLE_CUSTOM_NODES:
      if (action.data.isEnabled) {
        return true
      }
      return state
    default:
      return state
  }
}

export const isSetCustomNodesProcessing = (state: boolean = false, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.UPDATE_CUSTOM_NODES_PROCESSING:
      return action.data.isSetCustomNodesProcessing
    case ACTION.UPDATE_CUSTOM_NODES_LIST:
      return false
    default:
      return state
  }
}

export const settings = combineReducers({
  isSetCustomNodesModalVisible,
  isSetCustomNodesProcessing
})

export default settings
