/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { initialState, settings as settingsReducer } from './reducer.js'

test('initialState', () => {
  const expected = initialState
  const actual = settingsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
