/* globals test expect */

import { settings as settingsReducer, initialState } from './reducer.js'

test('initialState', () => {
  const expected = initialState
  const actual = settingsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
