/* globals test expect */

import { contacts, errorAlert, passwordReminder, request, scenes, settings, transactionAlert, uiReducer, wallets } from './reducer.js'

test('initialState', () => {
  const initialState = {
    errorAlert: errorAlert(undefined, {}),
    transactionAlert: transactionAlert(undefined, {}),
    passwordReminder: passwordReminder(undefined, {}),
    scenes: scenes(undefined, {}),
    wallets: wallets(undefined, {}),
    request: request(undefined, {}),
    settings: settings(undefined, {}),
    contacts: contacts(undefined, {})
  }
  const expected = initialState
  const actual = uiReducer(undefined, {})

  expect(actual).toEqual(expected)
})
