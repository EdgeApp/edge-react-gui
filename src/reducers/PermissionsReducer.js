// @flow

import type { Action } from '../types/reduxTypes.js'

// To add new permissions, just put them in this list an in `initialState`:
export type Permission = 'camera' | 'contacts' | 'location'
export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined'
export type PermissionsState = {
  [permission: Permission]: PermissionStatus
}

export const initialState = {
  camera: 'undetermined',
  contacts: 'undetermined',
  location: 'undetermined'
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
