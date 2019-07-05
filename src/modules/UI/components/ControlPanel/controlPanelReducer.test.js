/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { controlPanel as controlPanelReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    usersView: false
  }
  const actual = controlPanelReducer(undefined, {})

  expect(actual).toEqual(expected)
})
