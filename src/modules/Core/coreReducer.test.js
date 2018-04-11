/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { core as coreReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    account: {},
    context: {
      context: {},
      nextUsername: '',
      usernames: []
    },
    deepLinking: {
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
  const actual = coreReducer(undefined, {})

  expect(actual).toEqual(expected)
})
