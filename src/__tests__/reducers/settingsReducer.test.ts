import { expect, test } from '@jest/globals'

import { initialState, settings as settingsReducer } from '../../reducers/scenes/SettingsReducer'

test('initialState', () => {
  const expected = initialState
  const actual = settingsReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
