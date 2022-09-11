import RNPermissions from 'react-native-permissions'

import { Action } from '../types/reduxTypes'
const { UNAVAILABLE, BLOCKED, DENIED, GRANTED, LIMITED } = RNPermissions.RESULTS

// To add new permissions, just put them in this list an in `initialState`:
export type Permission = 'camera' | 'contacts' | 'location'
export type PermissionStatus = typeof UNAVAILABLE | typeof BLOCKED | typeof DENIED | typeof GRANTED | typeof LIMITED
export type PermissionsState = {
  // @ts-expect-error
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
