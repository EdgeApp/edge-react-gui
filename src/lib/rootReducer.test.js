/* globals test expect */

import { core, cryptoExchange, exchangeRates, permissions, rootReducer, ui } from './rootReducer.js'

test('initialState', () => {
  const expected = {
    core: core(undefined, {}),
    ui: ui(undefined, {}),
    cryptoExchange: cryptoExchange(undefined, {}),
    exchangeRates: exchangeRates(undefined, {}),
    permissions: permissions(undefined, {})
  }
  const actual = rootReducer(undefined, {})

  expect(actual).toEqual(expected)
})
