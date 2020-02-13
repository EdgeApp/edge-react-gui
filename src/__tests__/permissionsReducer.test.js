// @flow

/* globals test expect */

import { initialState, permissions as permissionsReducer } from '../reducers/PermissionsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = initialState
  const actual = permissionsReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})

test('updatePermissions => AUTHORIZED', () => {
  const expected = {
    ...initialState,
    camera: 'authorized'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'authorized' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => DENIED', () => {
  const expected = {
    ...initialState,
    camera: 'denied'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'denied' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => RESTRICTED', () => {
  const expected = {
    ...initialState,
    camera: 'restricted'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'restricted' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    camera: 'restricted',
    contacts: 'authorized'
  }
  const action = {
    type: 'PERMISSIONS/UPDATE',
    data: {
      camera: 'restricted',
      contacts: 'authorized'
    }
  }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})
