import { expect, test } from '@jest/globals'

import { scenes as scenesReducer } from '../../reducers/scenes/ScenesReducer'
import { initialState as SendConfirmationInitialState } from '../../reducers/scenes/SendConfirmationReducer'

test('initialState', () => {
  const expected = {
    createWallet: {
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
        supportedAssets: [],
        activationCost: ''
      },
      walletAccountActivationQuoteError: ''
    },
    fioAddress: {
      fioAddresses: [],
      fioAddressesLoading: false,
      fioDomains: []
    },
    sendConfirmation: SendConfirmationInitialState,
    transactionDetails: {
      subcategories: []
    },
    transactionList: {
      transactions: [],
      transactionIdMap: {},
      currentCurrencyCode: '',
      currentEndIndex: 0,
      numTransactions: 0,
      currentWalletId: ''
    }
  }
  const actual = scenesReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
