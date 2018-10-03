// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export type SettingsSceneState = {
  isSetCustomNodesModalVisible: boolean,
  isSetCustomNodesProcessing: boolean
}

export const isSetCustomNodesModalVisible = (state: boolean = false, action: Action): boolean => {
  switch (action.type) {
    case 'SET_CUSTOM_NODES_MODAL_VISIBILITY':
      if (!action.data) throw new TypeError('Invalid action')
      const { isSetCustomNodesModalVisible } = action.data
      return isSetCustomNodesModalVisible
    case 'UPDATE_CUSTOM_NODES_LIST':
      return false
    case 'SET_ENABLE_CUSTOM_NODES':
      if (action.data.isEnabled) {
        return true
      }
      return state
    default:
      return state
  }
}

export const isSetCustomNodesProcessing = (state: boolean = false, action: Action): boolean => {
  switch (action.type) {
    case 'UPDATE_CUSTOM_NODES_PROCESSING':
      if (!action.data) throw new TypeError('Invalid action')
      const { isSetCustomNodesProcessing } = action.data
      return isSetCustomNodesProcessing
    case 'UPDATE_CUSTOM_NODES_LIST':
      return false
    default:
      return state
  }
}

export const settings: Reducer<SettingsSceneState, Action> = combineReducers({
  isSetCustomNodesModalVisible,
  isSetCustomNodesProcessing
})

export default settings
