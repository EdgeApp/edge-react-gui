// @flow

/* globals test expect */

import { passwordReminder, scenes, settings, ui, wallets } from '../modules/UI/reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const initialState = {
    passwordReminder: passwordReminder(undefined, dummyAction),
    scenes: scenes(undefined, dummyAction),
    wallets: wallets(undefined, dummyAction),
    settings: settings(undefined, dummyAction)
  }
  const expected = initialState
  const actual = ui(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
