/* globals test expect */

import { settings as settingsReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    BCH: {
      denomination: '100000000'
    },
    BTC: {
      denomination: '100000000'
    },
    DASH: {
      denomination: '100000000'
    },
    ETH: {
      denomination: '1000000000000000000'
    },
    LTC: {
      denomination: '100000000'
    },
    REP: {
      denomination: '1000000000000000000'
    },
    WINGS: {
      denomination: '1000000000000000000'
    },
    account: null,
    autoLogoutTimeInSeconds: 3600,
    bluetoothMode: false,
    changesLocked: true,
    customTokens: [],
    defaultFiat: 'USD',
    isOtpEnabled: false,
    isTouchEnabled: false,
    isTouchSupported: false,
    loginStatus: null,
    merchantMode: false,
    otpKey: null,
    otpMode: false,
    otpResetDate: null,
    pinMode: false,
    plugins: {
      arrayPlugins: [],
      supportedWalletTypes: []
    }
  }
  const actual = settingsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
