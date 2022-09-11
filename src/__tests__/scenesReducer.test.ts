/* globals test expect */

import { initialState as SendConfirmationInitialState } from '../modules/UI/scenes/SendConfirmation/selectors'
import { scenes as scenesReducer } from '../reducers/scenes/ScenesReducer'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

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
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
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
  // @ts-expect-error
  const actual = scenesReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
