/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { cryptoExchanger as cryptoExchangerReducer } from './CryptoExchangeReducer.js'

test('initialState', () => {
  const actual = cryptoExchangerReducer(undefined, {})

  expect(actual).toMatchSnapshot()
})
