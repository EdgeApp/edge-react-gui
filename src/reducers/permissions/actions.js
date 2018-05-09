// @flow

import type { Dispatch } from '../../modules/ReduxTypes'
import type { Permission, PermissionStatus } from '../../modules/UI/permissions.js'
import { request } from '../../modules/UI/permissions.js'

export const PREFIX = 'PERMISSIONS/'

export const requestPermission = (permission: Permission) => (dispatch: Dispatch, getState: any) => {
  const state = getState()
  if (state.permissions[permission] === 'authorized') {
    return
  }
  return request(permission).then(status => {
    dispatch(updatePermissions({ [permission]: status }))
  })
}

export const UPDATE_PERMISSIONS = PREFIX + 'UPDATE'
export const updatePermissions = (permissions: { [Permission]: PermissionStatus }) => ({
  type: UPDATE_PERMISSIONS,
  data: { ...permissions }
})
