// @flow

/* globals test expect */

import { initialState as SendConfirmationInitialState } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { request } from '../reducers/scenes/RequestReducer.js'
import { scenes as scenesReducer } from '../reducers/scenes/ScenesReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    ABAlert: {
      syntax: {
        buttons: [],
        message: '',
        title: ''
      },
      view: false
    },
    controlPanel: {
      selectedUser: null,
      usersView: false
    },
    createWallet: {
      isCreatingWallet: false,
      walletAccountActivationPaymentInfo: {
        paymentAddress: '',
        nativeAmount: '',
        currencyCode: '',
        exchangeAmount: '',
        expirationDate: 0
      },
      isCheckingHandleAvailability: false,
      isHandleAvailable: false,
      handleActivationInfo: {
        supportedCurrencies: {},
        activationCost: ''
      }
    },
    dimensions: {
      keyboardHeight: 0
    },
    editToken: {
      deleteCustomTokenProcessing: false,
      deleteTokenModalVisible: false,
      editCustomTokenProcessing: false
    },
    exchangeRate: {
      exchangeRates: {}
    },
    helpModal: false,
    request: request(undefined, dummyAction),
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
    },
    scan: {
      addressModalVisible: false,
      scanEnabled: false,
      torchEnabled: false,
      legacyAddressModal: {
        isActive: false
      },
      privateKeyModal: {
        error: null,
        isSweeping: false,
        primaryModal: {
          isActive: false
        },
        secondaryModal: {
          isActive: false
        }
      },
      parsedUri: null
    },
    sendConfirmation: SendConfirmationInitialState,
    changeMiningFee: {
      isCustomFeeVisible: false
    },
    transactionAlert: {
      edgeTransaction: null,
      displayAlert: false
    },
    transactionDetails: {
      subcategories: []
    },
    transactionList: {
      searchVisible: false,
      transactions: [],
      currentCurrencyCode: '',
      currentEndIndex: 0,
      numTransactions: 0,
      currentWalletId: ''
    },
    walletList: {
      getSeedWalletModalVisible: false,
      privateSeedUnlocked: false,
      viewXPubWalletModalVisible: false,
      xPubSyntax: '',
      resyncWalletModalVisible: false,
      splitWalletModalVisible: false,
      walletArchivesVisible: false,
      walletId: ''
    },
    walletListModal: {
      walletListModalVisible: false
    },
    walletTransferList: {
      walletListModalVisible: false,
      walletTransferList: []
    },
    currentScene: '',
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
