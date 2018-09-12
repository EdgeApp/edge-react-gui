// @flow
/* globals describe it expect */

import { default as reducer } from './reducer.js'

describe('reducer', () => {
  const initialState = reducer(undefined, {})

  it('initial state', () => {
    // $FlowExpectedError
    const actual = reducer(undefined, {})

    expect(actual).toMatchSnapshot()
  })

  it('open rename wallet modal', () => {
    const action = {
      type: 'OPEN_RENAME_WALLET_MODAL',
      data: { walletId: 'RENAME WALLET ID', walletName: 'THIS IS THE WALLET NAME' }
    }
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
