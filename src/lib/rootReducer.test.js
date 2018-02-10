/* globals test expect */

import {
  rootReducer,
  core,
  ui,
  cryptoExchange,
  exchangeRates,
  permissions
} from './rootReducer.js'

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
