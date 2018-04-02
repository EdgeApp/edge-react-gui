/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { dropdownAlert as dropdownAlertReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    message: '',
    title: '',
    type: '',
    visible: false
  }
  const actual = dropdownAlertReducer(undefined, {})

  expect(actual).toEqual(expected)
})
