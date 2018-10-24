// @flow

import RNPermissions from 'react-native-permissions'

export type Permission = 'camera' | 'contacts' | 'photo'
export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined'

export const CAMERA = 'camera'
export const CONTACTS = 'contacts'
export const PHOTOS = 'photo'

export const AUTHORIZED = 'authorized'
export const DENIED = 'denied'
export const RESTRICTED = 'restricted'
export const UNDETERMINED = 'undetermined'

export const request = (permission: Permission): Promise<PermissionStatus> => {
  return RNPermissions.check(permission).then(status => {
    if (status === UNDETERMINED) {
      return RNPermissions.request(permission)
    }

    return Promise.resolve(status)
  })
}

export const isAuthorized = (permissionStatus: PermissionStatus) => {
  return permissionStatus === AUTHORIZED
}
