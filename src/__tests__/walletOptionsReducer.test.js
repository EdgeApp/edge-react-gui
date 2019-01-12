// @flow

/* globals describe it expect */

import { walletList as reducer } from '../reducers/WalletOptionsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('reducer', () => {
  const initialState = reducer(undefined, dummyAction)

  it('initial state', () => {
    const actual = reducer(undefined, dummyAction)

    expect(actual).toMatchSnapshot()
  })

  it('open viewxpub wallet modal', () => {
    const action = {
      type: 'OPEN_VIEWXPUB_WALLET_MODAL',
      data: { walletId: 'VIEWXPUB WALLET ID', xPub: 'VIEWXPUB xpub1892736451987263r' }
    }
    const actual = reducer(initialState, action)

    expect(actual).toMatchSnapshot()
  })
})
