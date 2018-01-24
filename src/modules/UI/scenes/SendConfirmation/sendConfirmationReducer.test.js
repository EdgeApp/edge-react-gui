/* globals test expect */

import { sendConfirmation as sendConfirmationReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    displayAmount: undefined,
    draftStatus: 'under',
    error: null,
    feeSatoshi: 0,
    feeSetting: 'standard',
    inputCurrencySelected: 'fiat',
    isKeyboardVisible: false,
    isPinEnabled: false,
    isSliderLocked: false,
    label: '',
    maxSatoshi: 0,
    parsedUri: {
      nativeAmount: '',
      publicAddress: ''
    },
    pending: false,
    publicAddress: '',
    transaction: null
  }
  const actual = sendConfirmationReducer(undefined, {})

  expect(actual).toEqual(expected)
})
