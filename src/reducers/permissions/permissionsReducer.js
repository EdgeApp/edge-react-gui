// @flow

import type { Action } from '../../modules/ReduxTypes'
import type { Permission, PermissionStatus } from '../../modules/UI/permissions'

export type PermissionsState = { [Permission]: PermissionStatus }

export const initialState = {
  bluetooth: 'undetermined',
  camera: 'undetermined',
  contacts: 'undetermined',
  photo: 'undetermined'
}

export const permissions = (state: PermissionsState = initialState, action: Action) => {
  switch (action.type) {
    case 'PERMISSIONS/UPDATE': {
      return {
        ...state,
        ...action.data
      }
    }

    default:
      return state
  }
}
