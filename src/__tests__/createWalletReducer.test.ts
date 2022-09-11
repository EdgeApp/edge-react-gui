/* globals test expect */

import { createWallet as createWalletReducer } from '../reducers/scenes/CreateWalletReducer'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    walletAccountActivationPaymentInfo: {
      paymentAddress: '',
      amount: '',
      currencyCode: '',
      exchangeAmount: '',
      expireTime: 0
    },
    isCheckingHandleAvailability: false,
    handleAvailableStatus: '',
    handleActivationInfo: {
      supportedCurrencies: {},
      activationCost: ''
    },
    walletAccountActivationQuoteError: ''
  }
  // @ts-expect-error
  const actual = createWalletReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
