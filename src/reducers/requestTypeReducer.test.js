/* globals test expect */
import { requestType as requestTypeReducer } from './RequestTypeReducer.js'

test('initialState', () => {
  const expected = {
    useLegacyAddress: false,
    uniqueLegacyAddress: false
  }
  const actual = requestTypeReducer(undefined, {})

  expect(actual).toEqual(expected)
})
