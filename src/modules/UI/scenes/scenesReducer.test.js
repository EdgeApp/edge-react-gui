/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { scenes as scenesReducer } from './reducer.js'
import { request } from './Request/reducer.js'

test('initialState', () => {
  const expected = {
    ABAlert: {
      syntax: {},
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
    request: request(undefined, {}),
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
    },
    scan: {
      addressModalVisible: false,
      scanEnabled: false,
      scanToWalletListModalVisibility: false,
      selectedWalletListModalVisibility: false,
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
    sendConfirmation: {
      pending: false,
      isKeyboardVisible: false,
      forceUpdateGuiCounter: 0,
      spendInfo: null,
      destination: '',
      isEditable: true,
      nativeAmount: '0',
      transaction: {
        txid: '',
        date: 0,
        currencyCode: '',
        blockHeight: -1,
        nativeAmount: '0',
        networkFee: '',
        parentNetworkFee: '',
        ourReceiveAddresses: [],
        signedTx: '',
        metadata: {},
        otherParams: {}
      },
      parsedUri: {
        networkFeeOption: 'standard',
        customNetworkFee: {},
        publicAddress: '',
        nativeAmount: '0',
        metadata: {
          payeeName: '',
          category: '',
          notes: '',
          amountFiat: 0,
          bizId: 0,
          miscJson: ''
        }
      },
      error: null
    },
    changeMiningFee: {
      isCustomFeeVisible: false
    },
    transactionAlert: {
      edgeTransaction: '',
      displayAlert: false
    },
    transactionDetails: {
      subcategories: []
    },
    transactionList: {
      searchVisible: false,
      transactions: [],
      transactionsWalletListModalVisibility: false,
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
    uniqueIdentifierModal: {
      isActive: false,
      uniqueIdentifier: ''
    }
  }
  const actual = scenesReducer(undefined, {})

  expect(actual).toEqual(expected)
})
