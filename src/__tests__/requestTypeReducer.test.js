// @flow

import { expect, test } from '@jest/globals'

import { requestType as requestTypeReducer } from '../reducers/RequestTypeReducer.js'

test('initialState', () => {
  const expected = {
    useLegacyAddress: false,
    uniqueLegacyAddress: false
  }
  const actual = requestTypeReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
