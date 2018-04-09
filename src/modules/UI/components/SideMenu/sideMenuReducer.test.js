/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { sideMenu as sideMenuReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    view: false
  }
  const actual = sideMenuReducer(undefined, {})

  expect(actual).toEqual(expected)
})
