/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { AUTHORIZED, DENIED, RESTRICTED } from '../../modules/UI/permissions.js'
import { updatePermissions } from './actions.js'
import { initialState, permissionsReducer } from './permissionsReducer.js'

test('initialState', () => {
  const expected = initialState
  const actual = permissionsReducer(undefined, { type: 'UNKNOWN' })

  expect(actual).toEqual(expected)
})

test('updatePermissions => AUTHORIZED', () => {
  const expected = {
    ...initialState,
    camera: AUTHORIZED
  }
  const action = updatePermissions({ camera: AUTHORIZED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => DENIED', () => {
  const expected = {
    ...initialState,
    camera: DENIED
  }
  const action = updatePermissions({ camera: DENIED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => RESTRICTED', () => {
  const expected = {
    ...initialState,
    camera: RESTRICTED
  }
  const action = updatePermissions({ camera: RESTRICTED })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})

test('updatePermissions => MULTI', () => {
  const expected = {
    ...initialState,
    bluetooth: AUTHORIZED,
    camera: RESTRICTED,
    contacts: AUTHORIZED
  }
  const action = updatePermissions({
    bluetooth: AUTHORIZED,
    camera: RESTRICTED,
    contacts: AUTHORIZED
  })
  const actual = permissionsReducer(initialState, action)

  expect(actual).toEqual(expected)
})
