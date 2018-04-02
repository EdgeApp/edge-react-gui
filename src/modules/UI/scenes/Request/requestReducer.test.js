/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { request as requestReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    inputCurrencySelected: 'fiat',
    receiveAddress: {
      amountSatoshi: 0,
      metadata: {
        amountFiat: 0,
        bizId: null,
        category: '',
        miscJson: '',
        notes: '',
        payeeName: ''
      },
      publicAddress: ''
    }
  }
  const actual = requestReducer(undefined, {})

  expect(actual).toEqual(expected)
})
