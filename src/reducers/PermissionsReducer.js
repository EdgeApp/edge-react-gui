// @flow

import type { Action } from '../types/reduxTypes.js'

export type Permission = 'camera' | 'contacts'
export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined'
export type PermissionsState = {
  [permission: Permission]: PermissionStatus
}

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
