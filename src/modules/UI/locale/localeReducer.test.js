/* globals test expect */

import { locale as localeReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    'localeInfo': {}
  }
  const actual = localeReducer(undefined, {})

  expect(actual).toEqual(expected)
})
