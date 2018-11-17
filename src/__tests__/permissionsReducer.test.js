// @flow

/* globals test expect */

import { type Permission, type PermissionStatus, PermissionStatusStrings } from '../modules/PermissionsManager.js'
import { initialState, permissions as permissionsReducer } from '../reducers/PermissionsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

const updatePermissionsAction = (permissions: { [Permission]: PermissionStatus }) => ({
  type: 'PERMISSIONS/UPDATE',
  data: { ...permissions }
})

test('initialState', () => {
  const expected = initialState
  const actual = permissionsReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})

test('updatePermissions => AUTHORIZED', () => {
  const expected = {
    ...initialState,
    camera: PermissionStatusStrings.AUTHORIZED
  }
  const action = updatePermissionsAction({ camera: PermissionStatusStrings.AUTHORIZED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => DENIED', () => {
  const expected = {
    ...initialState,
    camera: PermissionStatusStrings.DENIED
  }
  const action = updatePermissionsAction({ camera: PermissionStatusStrings.DENIED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => RESTRICTED', () => {
  const expected = {
    ...initialState,
    camera: PermissionStatusStrings.RESTRICTED
  }
  const action = updatePermissionsAction({ camera: PermissionStatusStrings.RESTRICTED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    camera: PermissionStatusStrings.RESTRICTED,
    contacts: PermissionStatusStrings.AUTHORIZED
  }
  const action = updatePermissionsAction({
    camera: PermissionStatusStrings.RESTRICTED,
    contacts: PermissionStatusStrings.AUTHORIZED
  })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})
