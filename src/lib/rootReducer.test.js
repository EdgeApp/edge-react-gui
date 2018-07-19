/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { onBoarding, contacts, core, cryptoExchange, exchangeRates, permissions, rootReducer, ui } from './rootReducer.js'

test('initialState', () => {
  const expected = {
    core: core(undefined, {}),
    ui: ui(undefined, {}),
    cryptoExchange: cryptoExchange(undefined, {}),
    exchangeRates: exchangeRates(undefined, {}),
    permissions: permissions(undefined, {}),
    contacts: contacts(undefined, {}),
    onBoarding: onBoarding(undefined, {})

  }
  const actual = rootReducer(undefined, {})

  expect(actual).toEqual(expected)
})
