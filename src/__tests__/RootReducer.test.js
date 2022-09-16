// @flow

import { expect, test } from '@jest/globals'

import { rootReducer } from '../reducers/RootReducer.js'

test('initialState', () => {
  const actual = rootReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toMatchSnapshot()
})
