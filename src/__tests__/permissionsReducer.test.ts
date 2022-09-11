/* globals test expect */
import { RESULTS } from 'react-native-permissions'

import { initialState, permissions as permissionsReducer } from '../reducers/PermissionsReducer'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = initialState
  // @ts-expect-error
  const actual = permissionsReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})

test('updatePermissions => UNAVAILABLE', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.UNAVAILABLE
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: RESULTS.UNAVAILABLE } }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => BLOCKED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.BLOCKED
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: RESULTS.BLOCKED } }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => GRANTED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.GRANTED
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: RESULTS.GRANTED } }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => DENIED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.DENIED
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: RESULTS.DENIED } }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => LIMITED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.LIMITED
  }
  const action = { type: 'PERMISSIONS/UPDATE', data: { camera: RESULTS.LIMITED } }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.LIMITED,
    contacts: RESULTS.GRANTED
  }
  const action = {
    type: 'PERMISSIONS/UPDATE',
    data: {
      camera: RESULTS.LIMITED,
      contacts: RESULTS.GRANTED
    }
  }
  // @ts-expect-error
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})
