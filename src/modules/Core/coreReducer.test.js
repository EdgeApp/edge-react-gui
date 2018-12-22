// @flow

/* globals test expect */

import { core as coreReducer } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    account: {},
    context: {
      context: {},
      folder: {},
      nextUsername: '',
      usernames: []
    },
    deepLinking: {
      addressDeepLinkData: {},
      deepLinkPending: false,
      passwordRecoveryLink: null
    },
    edgeLogin: {
      error: null,
      isProcessing: false,
      lobby: null
    },
    wallets: {
      byId: {}
    }
  }
  const actual = coreReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
