// @flow

/* globals test expect */

import { context as contextReducer } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    context: {},
    folder: {},
    nextUsername: '',
    usernames: []
  }
  const actual = contextReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
