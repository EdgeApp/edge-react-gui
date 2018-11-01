/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */
import { requestType as requestTypeReducer } from '../reducers/RequestTypeReducer.js'

test('initialState', () => {
  const expected = {
    useLegacyAddress: false,
    uniqueLegacyAddress: false
  }
  const actual = requestTypeReducer(undefined, {})

  expect(actual).toEqual(expected)
})
