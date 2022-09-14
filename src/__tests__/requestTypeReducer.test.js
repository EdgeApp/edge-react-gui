// @flow

import { expect, test } from '@jest/globals'

import { requestType as requestTypeReducer } from '../reducers/RequestTypeReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    useLegacyAddress: false,
    uniqueLegacyAddress: false
  }
  const actual = requestTypeReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
