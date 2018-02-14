// @flow

import type { Permission, State } from '../../modules/ReduxTypes'

export const getBluetoothPermission = (state: State) => {
  return state.permissions.bluetooth
}

export const getCameraPermission = (state: State) => {
  return state.permissions.camera
}

export const getContactsPermission = (state: State) => {
  return state.permissions.contacts
}

export const getPhotosPermission = (state: State) => {
  return state.permissions.photos
}

export const getPermissionStatus = (state: State, permission: Permission) => {
  return state.permissions[permission]
}
