/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { changeMiningFee as changeMiningFeeReducer } from '../reducers/scenes/ChangeMiningFeeReducer.js'

test('initialState', () => {
  const expected = {
    isCustomFeeVisible: false
  }
  const actual = changeMiningFeeReducer(undefined, {})

  expect(actual).toEqual(expected)
})
