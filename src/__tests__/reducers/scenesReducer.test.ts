import { expect, test } from '@jest/globals'

import { initialState as SendConfirmationInitialState } from '../../modules/UI/scenes/SendConfirmation/selectors'
import { scenes as scenesReducer } from '../../reducers/scenes/ScenesReducer'

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
        supportedCurrencies: {},
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
