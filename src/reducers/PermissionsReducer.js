// @flow

import type { Action } from '../types/reduxTypes.js'

// To add new permissions, just put them in this list an in `initialState`:
export type Permission = 'camera' | 'contacts' | 'location'
export type PermissionStatus = 'unavailable' | 'blocked' | 'denied' | 'granted' | 'limited'
export type PermissionsState = {
  [permission: Permission]: PermissionStatus
}

export const initialState = {
  camera: 'denied',
  contacts: 'denied',
  location: 'denied'
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
