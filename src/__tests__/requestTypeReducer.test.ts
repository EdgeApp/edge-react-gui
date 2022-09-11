/* globals test expect */
import { requestType as requestTypeReducer } from '../reducers/RequestTypeReducer'

test('initialState', () => {
  const expected = {
    useLegacyAddress: false,
    uniqueLegacyAddress: false
  }
  const actual = requestTypeReducer(undefined, {})

  expect(actual).toEqual(expected)
})
