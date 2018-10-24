// @flow

import type { Permission, State } from '../../modules/ReduxTypes'

export const getCameraPermission = (state: State) => {
  return state.permissions.camera
}

export const getContactsPermission = (state: State) => {
  return state.permissions.contacts
}

export const getPhotosPermission = (state: State) => {
  return state.permissions.photo
}

export const getPermissionStatus = (state: State, permission: Permission) => {
  return state.permissions[permission]
}
