/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { abAlertReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    syntax: {},
    view: false
  }
  const actual = abAlertReducer(undefined, {})

  expect(actual).toEqual(expected)
})
