/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { wallets as walletsReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    byId: {}
  }
  const actual = walletsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
