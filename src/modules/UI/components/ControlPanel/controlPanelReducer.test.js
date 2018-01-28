/* globals test expect */

import { controlPanel as controlPanelReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    selectedUser: null,
    usersView: false
  }
  const actual = controlPanelReducer(undefined, {})

  expect(actual).toEqual(expected)
})
