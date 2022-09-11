/* globals test expect */

import { rootReducer } from '../reducers/RootReducer'

test('initialState', () => {
  const action = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }
  // @ts-expect-error
  const actual = rootReducer(undefined, action)

  expect(actual).toMatchSnapshot()
})
