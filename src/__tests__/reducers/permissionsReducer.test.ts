import { expect, test } from '@jest/globals'
import { RESULTS } from 'react-native-permissions'

import { initialState, permissions as permissionsReducer } from '../../reducers/PermissionsReducer'

test('initialState', () => {
  const expected = initialState
  const actual = permissionsReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})

test('updatePermissions => UNAVAILABLE', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.UNAVAILABLE
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: { camera: RESULTS.UNAVAILABLE }
  })

  expect(actual).toEqual(expected)
})

test('updatePermissions => BLOCKED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.BLOCKED
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: { camera: RESULTS.BLOCKED }
  })

  expect(actual).toEqual(expected)
})

test('updatePermissions => GRANTED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.GRANTED
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: { camera: RESULTS.GRANTED }
  })

  expect(actual).toEqual(expected)
})

test('updatePermissions => DENIED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.DENIED
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: { camera: RESULTS.DENIED }
  })

  expect(actual).toEqual(expected)
})

test('updatePermissions => LIMITED', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.LIMITED
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: { camera: RESULTS.LIMITED }
  })

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    camera: RESULTS.LIMITED,
    contacts: RESULTS.GRANTED
  }
  const actual = permissionsReducer(initialState, {
    type: 'PERMISSIONS/UPDATE',
    data: {
      camera: RESULTS.LIMITED,
      contacts: RESULTS.GRANTED
    }
  })

  expect(actual).toEqual(expected)
})
