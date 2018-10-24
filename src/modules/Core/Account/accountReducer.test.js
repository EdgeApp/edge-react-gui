/* eslint-disable flowtype/require-valid-file-annotation */

/* globals describe test expect */

import { account as accountReducer, initialState } from './reducer.js'

describe('account', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = accountReducer(undefined, {})

    expect(actual).toEqual(expected)
  })

  test('LOGGED_IN', () => {
    const account = { id: '123123', activeWalletIds: ['1', '2', '3'] }
    const action = { type: 'ACCOUNT/LOGGED_IN', data: { account } }
    const actual = accountReducer(initialState, action)

    expect(actual).toMatchSnapshot()
  })
})
