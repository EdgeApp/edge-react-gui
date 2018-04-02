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
    request: {
      inputCurrencySelected: 'fiat',
      receiveAddress: {
        amountSatoshi: 0,
        metadata: {
          amountFiat: 0,
          bizId: null,
          category: '',
          miscJson: '',
          notes: '',
          payeeName: ''
        },
        publicAddress: ''
      }
    },
    requestType: {
      useLegacyAddress: false,
      uniqueLegacyAddress: false
    },
    scan: {
      addressModalVisible: false,
      recipientAddress: '',
      scanEnabled: false,
      scanToWalletListModalVisibility: false,
      selectedWalletListModalVisibility: false,
      torchEnabled: false
    },
    sendConfirmation: {
      label: '',
      pending: false,
      isKeyboardVisible: false,
      forceUpdateGuiCounter: 0,
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
    sideMenu: {
      view: false
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
      loadingTransactions: false, // needs to be changed later
      visibleTransactions: []
    },
    walletList: {
      deleteWalletModalVisible: false,
      getSeedWalletModalVisible: false,
      privateSeedUnlocked: false,
      renameWalletInput: '',
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
    currentScene: ''
  }
  const actual = scenesReducer(undefined, {})

  expect(actual).toEqual(expected)
})
