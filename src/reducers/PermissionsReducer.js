// @flow

import RNPermissions from 'react-native-permissions'

import type { Action } from '../types/reduxTypes.js'
const { UNAVAILABLE, BLOCKED, DENIED, GRANTED, LIMITED } = RNPermissions.RESULTS

// To add new permissions, just put them in this list an in `initialState`:
export type Permission = 'camera' | 'contacts' | 'location'
export type PermissionStatus = UNAVAILABLE | BLOCKED | DENIED | GRANTED | LIMITED
export type PermissionsState = {
  [permission: Permission]: PermissionStatus
}

export const initialState = {
  camera: DENIED,
  contacts: DENIED,
  location: DENIED
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
