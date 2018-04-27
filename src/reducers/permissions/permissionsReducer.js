// @flow

import type { Action } from '../../modules/ReduxTypes'
import type { Permission, PermissionStatus } from '../../modules/UI/permissions'
import { UPDATE_PERMISSIONS } from './actions.js'

export const initialState = {
  bluetooth: 'undetermined',
  camera: 'undetermined',
  contacts: 'undetermined',
  photos: 'undetermined'
}

export type PermissionsState = { [Permission]: PermissionStatus }
export const permissionsReducer = (state: PermissionsState = initialState, action: Action) => {
  switch (action.type) {
    case UPDATE_PERMISSIONS: {
      return {
        ...state,
        ...action.data
      }
    }
    default:
      return state
  }
}
