/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { request as requestReducer } from '../reducers/scenes/RequestReducer.js'

test('initialState', () => {
  const expected = {
    inputCurrencySelected: 'fiat',
    receiveAddress: {
      nativeAmount: '0',
      metadata: {},
      publicAddress: ''
    }
  }
  const actual = requestReducer(undefined, {})

  expect(actual).toEqual(expected)
})
