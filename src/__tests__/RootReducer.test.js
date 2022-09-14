// @flow

import { expect, test } from '@jest/globals'

import { rootReducer } from '../reducers/RootReducer.js'

test('initialState', () => {
  const action = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }
  const actual = rootReducer(undefined, action)

  expect(actual).toMatchSnapshot()
})
