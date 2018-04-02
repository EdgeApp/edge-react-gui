// @flow

import type { Dispatch, GetState } from '../../modules/ReduxTypes'
import { request } from '../../modules/UI/permissions.js'
import type { Permission, PermissionStatus } from '../../modules/UI/permissions.js'

export const PREFIX = 'PERMISSIONS/'
export const UPDATE_PERMISSIONS = PREFIX + 'UPDATE_PERMISSIONS'

export const requestPermission = (permission: Permission) => (dispatch: Dispatch, getState: GetState) => {
  return request(permission).then(
    status => {
      dispatch(updatePermissions({ [permission]: status }))
    },
    error => {
      console.log(error)
    }
  )
}

export const updatePermissions = (permissions: { [Permission]: PermissionStatus }) => ({
  type: UPDATE_PERMISSIONS,
  data: permissions
})
