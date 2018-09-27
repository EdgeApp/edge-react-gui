// @flow

/* globals test expect */

import { ABAlert } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    syntax: {
      buttons: [],
      message: '',
      title: ''
    },
    view: false
  }
  const actual = ABAlert(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
