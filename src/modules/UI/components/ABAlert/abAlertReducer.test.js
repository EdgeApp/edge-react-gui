// @flow

/* globals test expect */

import { ABAlert } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    syntax: {},
    view: false
  }
  const actual = ABAlert(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
