/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { context as contextReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    context: {},
    nextUsername: '',
    usernames: []
  }
  const actual = contextReducer(undefined, {})

  expect(actual).toEqual(expected)
})
