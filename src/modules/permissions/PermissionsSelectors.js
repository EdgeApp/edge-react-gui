// @flow

import type { Permission } from '../../modules/PermissionsManager.js'
import type { State } from '../../modules/ReduxTypes'

export const getCameraPermission = (state: State) => {
  return state.permissions.camera
}

export const getContactsPermission = (state: State) => {
  return state.permissions.contacts
}

export const getPermissionStatus = (state: State, permission: Permission) => {
  return state.permissions[permission]
}
