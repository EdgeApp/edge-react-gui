// @flow

/* globals test expect */

import { initialState, settings as settingsReducer } from './reducer.js'

test('initialState', () => {
  const expected = initialState
  // $FlowExpectedError
  const actual = settingsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
