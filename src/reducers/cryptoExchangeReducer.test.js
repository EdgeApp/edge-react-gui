/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { cryptoExchanger as cryptoExchangerReducer } from './CryptoExchangeReducer.js'

test('initialState', () => {
  const expected = {
    exchangeRate: 1,
    nativeMax: '0',
    nativeMin: '0',
    minerFee: '0',
    reverseExchange: 1,
    reverseNativeMax: '0',
    reverseNativeMin: '0',
    reverseMinerFee: '0',

    fromWallet: null,
    fromCurrencyCode: null,
    fromNativeAmount: '0',
    fromDisplayAmount: '0',
    fromWalletPrimaryInfo: null,
    fromCurrencyIcon: null,
    fromCurrencyIconDark: null,

    toWallet: null,
    toCurrencyCode: null,
    toNativeAmount: '0',
    toDisplayAmount: '0',
    toWalletPrimaryInfo: null,
    toCurrencyIcon: null,
    toCurrencyIconDark: null,

    insufficientError: false,
    feeSetting: 'standard',
    walletListModalVisible: false,
    confirmTransactionModalVisible: false,
    shiftTransactionError: null,
    genericShapeShiftError: null,
    changeWallet: 'none',
    forceUpdateGuiCounter: 0,
    transaction: null,
    gettingTransaction: false,
    availableShapeShiftTokens: [],
    shiftPendingTransaction: false
  }
  const actual = cryptoExchangerReducer(undefined, {})

  expect(actual).toEqual(expected)
})
