// @flow

import { permissionsReducer, initialState, type PermissionsState } from './permissionsReducer.js'
import {
  getContactsPermission,
  getPhotosPermission,
  getBluetoothPermission,
  getPermissionStatus
} from './selectors.js'

export type {PermissionsState}
export {
  getContactsPermission,
  getPhotosPermission,
  getBluetoothPermission,
  getPermissionStatus,
  initialState,
  permissionsReducer
}
