/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { errorAlert as errorAlertReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    displayAlert: false,
    message: ''
  }
  const actual = errorAlertReducer(undefined, {})

  expect(actual).toEqual(expected)
})
