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
      isCreatingWallet: false
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
      updatingBalance: true,
      loadingTransactions: false,
      currentCurrencyCode: '',
      currentEndIndex: 0,
      numTransactions: 0,
      currentWalletId: ''
    },
    walletList: {
      deleteWalletModalVisible: false,
      getSeedWalletModalVisible: false,
      privateSeedUnlocked: false,
      renameWalletInput: '',
      viewXPubWalletModalVisible: false,
      xPubSyntax: '',
      renameWalletModalVisible: false,
      resyncWalletModalVisible: false,
      splitWalletModalVisible: false,
      walletArchivesVisible: false,
      walletId: '',
      walletName: ''
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
      uniqueIdentifier: ''
    }
  }
  const actual = scenesReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
