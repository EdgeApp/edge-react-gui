/* globals test expect */

import { contacts as contactsReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    contactList: []
  }
  const actual = contactsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
