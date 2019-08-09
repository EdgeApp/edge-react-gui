// @flow

import type { Permission } from '../../modules/PermissionsManager.js'
import type { State } from '../../types/reduxTypes.js'

export const getCameraPermission = (state: State) => {
  return state.permissions.camera
}

export const getContactsPermission = (state: State) => {
  return state.permissions.contacts
}

export const getPermissionStatus = (state: State, permission: Permission) => {
  return state.permissions[permission]
}
