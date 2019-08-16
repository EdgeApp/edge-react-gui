// @flow

import type { Permission, PermissionStatus } from '../modules/PermissionsManager.js'
import type { Action } from '../types/reduxTypes.js'

export type PermissionsState = { [Permission]: PermissionStatus }

export const initialState = {
  camera: 'undetermined',
  contacts: 'undetermined'
}

export const permissions = (state: PermissionsState = initialState, action: Action) => {
  switch (action.type) {
    case 'PERMISSIONS/UPDATE': {
      return {
        ...state,
        ...action.data
      }
    }

    default:
      return state
  }
}
