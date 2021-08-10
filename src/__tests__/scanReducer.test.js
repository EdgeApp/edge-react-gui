// @flow
/* globals test expect */

import { scan as scanReducer } from '../reducers/scenes/ScanReducer.js'

test('initialState', () => {
  const expected = {
    scanEnabled: false,
    torchEnabled: false
  }
  const actual = scanReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
