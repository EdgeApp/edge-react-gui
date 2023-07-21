import { expect, test } from '@jest/globals'

import { createWallet as createWalletReducer } from '../../reducers/scenes/CreateWalletReducer'

test('initialState', () => {
  const expected = {
    walletAccountActivationPaymentInfo: {
      paymentAddress: '',
      amount: '',
      currencyCode: '',
      exchangeAmount: '',
      expireTime: 0
    },
    handleActivationInfo: {
      supportedAssets: [],
      activationCost: ''
    },
    walletAccountActivationQuoteError: ''
  }
  const actual = createWalletReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
