/* globals test expect */

import { initialState, settings as settingsReducer } from '../reducers/scenes/SettingsReducer'

test('initialState', () => {
  const expected = initialState
  // $FlowExpectedError
  const actual = settingsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
