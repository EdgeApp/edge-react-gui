/* globals test expect */

import { sendConfirmation as sendConfirmationReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    'label': '',
    'pending': false,
    'isKeyboardVisible': false,
    'networkFeeOption': 'standard',
    'customNetworkFee': {},
    'transaction': {
      'txid': '',
      'date': 0,
      'currencyCode': '',
      'blockHeight': -1,
      'nativeAmount': '',
      'networkFee': '',
      'ourReceiveAddresses': [],
      'signedTx': '',
      'metadata': {},
      'otherParams': {}
    },
    'parsedUri': {
      'publicAddress': '',
      'nativeAmount': '0',
      'metadata': {
        'payeeName': '',
        'category': '',
        'notes': '',
        'amountFiat': 0,
        'bizId': 0,
        'miscJson': ''
      }
    },
    'error': null
  }
  const actual = sendConfirmationReducer(undefined, {})

  expect(actual).toEqual(expected)
})
