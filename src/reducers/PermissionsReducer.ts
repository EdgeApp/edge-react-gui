import { Platform } from 'react-native'
import { PERMISSIONS, PermissionStatus } from 'react-native-permissions'
import { Reducer } from 'redux'

import { Action } from '../types/reduxTypes'

export interface PermissionsState {
  camera: PermissionStatus
  contacts: PermissionStatus
  location: PermissionStatus
}

export type Permission = keyof PermissionsState

/**
 * Maps from our names to the react-native-permissions names.
 */
export const permissionNames = {
  camera: Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA,
  contacts: Platform.OS === 'android' ? PERMISSIONS.ANDROID.READ_CONTACTS : PERMISSIONS.IOS.CONTACTS,
  location: Platform.OS === 'android' ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
}

export const initialState: PermissionsState = {
  camera: 'denied',
  contacts: 'denied',
  location: 'denied'
}

export const permissions: Reducer<PermissionsState, Action> = (state = initialState, action) => {
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
