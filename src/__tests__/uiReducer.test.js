// @flow

/* globals test expect */

import { errorAlert, passwordReminder, request, scenes, settings, transactionAlert, ui, wallets } from '../modules/UI/reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const initialState = {
    errorAlert: errorAlert(undefined, dummyAction),
    transactionAlert: transactionAlert(undefined, dummyAction),
    passwordReminder: passwordReminder(undefined, dummyAction),
    scenes: scenes(undefined, dummyAction),
    wallets: wallets(undefined, dummyAction),
    request: request(undefined, dummyAction),
    settings: settings(undefined, dummyAction)
  }
  const expected = initialState
  const actual = ui(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
