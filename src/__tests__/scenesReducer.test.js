// @flow

/* globals test expect */

import { initialState as SendConfirmationInitialState } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { scenes as scenesReducer } from '../reducers/scenes/ScenesReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    controlPanel: {
      usersView: false
    },
    createWallet: {
      isCreatingWallet: false,
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
    editToken: {
      deleteCustomTokenProcessing: false,
      deleteTokenModalVisible: false,
      editCustomTokenProcessing: false
    },
    exchangeRate: {
      exchangeRates: {}
    },
    fioAddress: {
      expiration: new Date('2020-01-01T10:10:10Z'),
      feeCollected: 0,
      fioAddressName: '',
      fioAddresses: [],
      fioAddressesLoading: false,
      selectedWallet: null,
      handleRegistrationInfo: {
        activationCost: 40,
        supportedCurrencies: {}
      },
      addressRegistrationPaymentInfo: {},
      regInfoLoading: false,
      fioWalletByAddress: null
    },
    fioRequest: {
      requests: [],
      amounts: {
        exchangeAmount: '',
        nativeAmount: ''
      },
      fioModalData: {},
      sentRequests: [],
      fioPendingRequestSelected: {},
      fioSentRequestSelected: {}
    },
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
    },
    scan: {
      scanEnabled: false,
      torchEnabled: false,
      privateKeyModal: {
        error: null,
        isSweeping: false,
        secondaryModal: {
          isActive: false
        }
      },
      parsedUri: null
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
    },
    walletList: {
      viewXPubWalletModalVisible: false,
      xPubExplorer: '',
      xPubSyntax: '',
      walletArchivesVisible: false,
      walletId: ''
    },
    passwordReminderModal: {
      status: null
    },
    passwordRecoveryReminderModal: {
      isVisible: false
    },
    uniqueIdentifierModal: {
      isActive: false,
      uniqueIdentifier: undefined
    }
  }
  const actual = scenesReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
