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

  it('open rename wallet modal', () => {
    const action = {
      type: 'OPEN_RENAME_WALLET_MODAL',
      data: { walletId: 'RENAME WALLET ID', walletName: 'THIS IS THE WALLET NAME' }
    }
    // $FlowFixMe
    const actual = reducer(initialState, action)

    expect(actual).toMatchSnapshot()
  })

  it('open delete wallet modal', () => {
    const action = {
      type: 'OPEN_DELETE_WALLET_MODAL',
      data: { walletId: 'DELETE WALLET ID' }
    }
    const actual = reducer(initialState, action)

    expect(actual).toMatchSnapshot()
  })

  it('open resync wallet modal', () => {
    const action = {
      type: 'OPEN_RESYNC_WALLET_MODAL',
      data: { walletId: 'RESYNC WALLET ID' }
    }
    const actual = reducer(initialState, action)

    expect(actual).toMatchSnapshot()
  })

  it('open getseed wallet modal', () => {
    const action = {
      type: 'OPEN_GETSEED_WALLET_MODAL',
      data: { walletId: 'GETSEED WALLET ID' }
    }
    const actual = reducer(initialState, action)

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
