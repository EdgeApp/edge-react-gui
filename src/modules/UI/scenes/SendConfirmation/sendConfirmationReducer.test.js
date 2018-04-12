/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { sendConfirmation as sendConfirmationReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    label: '',
    pending: false,
    isKeyboardVisible: false,
    forceUpdateGuiCounter: 0,
    transaction: {
      txid: '',
      date: 0,
      currencyCode: '',
      blockHeight: -1,
      nativeAmount: '0',
      networkFee: '',
      parentNetworkFee: '',
      ourReceiveAddresses: [],
      signedTx: '',
      metadata: {},
      otherParams: {}
    },
    parsedUri: {
      networkFeeOption: 'standard',
      customNetworkFee: {},
      publicAddress: '',
      nativeAmount: '0',
      metadata: {
        payeeName: '',
        category: '',
        notes: '',
        amountFiat: 0,
        bizId: 0,
        miscJson: ''
      }
    },
    error: null
  }
  const actual = sendConfirmationReducer(undefined, {})

  expect(actual).toEqual(expected)
})
