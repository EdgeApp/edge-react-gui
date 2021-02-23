// @flow

/* globals test expect */

import { initialState, permissions as permissionsReducer } from '../reducers/PermissionsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = initialState
  const actual = permissionsReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})

test('updatePermissions => UNAVAILABLE', () => {
  const expected = {
    ...initialState,
    camera: 'unavailable'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'unavailable' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => BLOCKED', () => {
  const expected = {
    ...initialState,
    camera: 'blocked'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'blocked' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => GRANTED', () => {
  const expected = {
    ...initialState,
    camera: 'granted'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'granted' } }
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

test('updatePermissions => LIMITED', () => {
  const expected = {
    ...initialState,
    camera: 'limited'
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: 'limited' } }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    camera: 'limited',
    contacts: 'granted'
  }
  const action = {
    type: 'PERMISSIONS/UPDATE',
    data: {
      camera: 'limited',
      contacts: 'granted'
    }
  }
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})
