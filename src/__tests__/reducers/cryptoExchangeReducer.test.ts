import { expect, test } from '@jest/globals'

import { cryptoExchange } from '../../reducers/CryptoExchangeReducer'

test('initialState', () => {
  const actual = cryptoExchange(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toMatchSnapshot()
})
