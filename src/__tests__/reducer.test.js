/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { contacts, core, cryptoExchange, exchangeRates, permissions, rootReducer, ui } from '../reducers/scenes/MainReducer.js'

test('initialState', () => {
  const expected = {
    core: core(undefined, {}),
    ui: ui(undefined, {}),
    cryptoExchange: cryptoExchange(undefined, {}),
    exchangeRates: exchangeRates(undefined, {}),
    permissions: permissions(undefined, {}),
    contacts: contacts(undefined, {})
  }
  const actual = rootReducer(undefined, {})

  expect(actual).toEqual(expected)
})
