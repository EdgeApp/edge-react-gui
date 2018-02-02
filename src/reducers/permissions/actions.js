// @flow

import RNPermissions from 'react-native-permissions'

import {request, type Permission, type PermissionStatus} from '../../modules/UI/permissions.js'
import type {Dispatch, GetState} from '../../modules/ReduxTypes'

export const PREFIX = 'PERMISSIONS/'
export const UPDATE_PERMISSIONS = PREFIX + 'UPDATE_PERMISSIONS'

export const requestPermission = (permission: Permission) => (dispatch: Dispatch, getState: GetState) => {
  RNPermissions.check(permission)
  .then(permissionStatus => {
    request(permission)
    .then(status => dispatch(updatePermissions({ [permission]: status })))
    .catch(console.log)
  })
}

export const updatePermissions = (permissions: {[Permission]: PermissionStatus}) => ({
  type: UPDATE_PERMISSIONS,
  data: permissions
})
