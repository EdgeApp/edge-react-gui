// @flow

import RNPermissions from 'react-native-permissions'

export type Permission = 'bluetooth' | 'camera' | 'contacts' | 'photos'
export type MultiPermission = Array<Permission>
export type Permissions = Permission | MultiPermission
export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined'

export const CAMERA = 'camera'
export const BLUETOOTH = 'bluetooth'
export const CONTACTS = 'contacts'
export const PHOTOS = 'photos'

export const AUTHORIZED = 'authorized'
export const DENIED = 'denied'
export const RESTRICTED = 'restricted'
export const UNDETERMINED = 'undetermined'

export const request = (permissions: Permissions): Promise<boolean> => {
  return Array.isArray(permissions)
    ? permissions.reduce((requests, permission) => {
      return requests.then(singleRequest(permission))
    }, Promise.resolve())
    : singleRequest(permissions)
}

const singleRequest = permission => {
  return RNPermissions.request(permission).catch(console.log)
}
