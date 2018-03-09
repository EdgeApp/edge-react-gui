// @flow

import type {
  AbcAccount,
  AbcContext,
  AbcCurrencyPlugin,
  AbcCurrencyWallet,
  AbcDenomination,
  AbcLobby,
  AbcParsedUri,
  AbcReceiveAddress,
  AbcTransaction,
  EdgeReceiveAddress
} from 'edge-core-js'
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'

import type { ContactsState } from '../reducers/contacts/contactsReducer.js'
import type { PermissionsState } from '../reducers/permissions/permissionsReducer.js'
import type { DeviceDimensions, GuiContact, GuiCurrencyInfo, GuiWallet, DateTransactionGroup } from '../types'
import type { Permission, PermissionStatus } from './UI/permissions.js'

export type Action = { type: string, data?: any }

export type CurrencyCode = string
export type Id = string
export type Username = string
export type { PermissionsState, PermissionStatus, Permission }

export type State = {
  core: {
    account: AbcAccount,
    context: {
      context: AbcContext,
      usernames: Array<Username>,
      nextUsername: Username
    },
    wallets: {
      byId: {
        [Id]: AbcCurrencyWallet
      }
    },
    edgeLogin: {
      lobby: AbcLobby | null,
      error: Error | null,
      isProcessing: boolean
    },
    deepLinking: {
      passwordRecoveryLink: string | null
    }
  },
  ui: {
    errorAlert: {
      displayAlert: boolean,
      message: string
    },
    transactionAlert: {
      displayAlert: boolean,
      abcTransaction: AbcTransaction
    },
    scenes: {
      scan: {
        torchEnabled: boolean,
        addressModalVisible: boolean,
        recipientAddress: string,
        scanEnabled: boolean,
        selectedWalletListModalVisibility: boolean,
        scanToWalletListModalVisibility: boolean
      },
      sendConfirmation: {
        transaction: AbcTransaction | null,
        parsedUri: AbcParsedUri,
        error: Error | null,
        label: string,
        networkFeeOption: 'low' | 'standard' | 'high' | 'custom',
        customNetworkFee: any,
        isKeyboardVisible: boolean,
        forceUpdateGuiCounter: number,
        pending: boolean
      },
      changeMiningFee: {
        isCustomFeeVisible: boolean
      },
      transactionList: {
        transactions: Array<AbcTransaction>,
        contactsList: Array<GuiContact>,
        updatingBalance: boolean,
        searchVisible: boolean,
        visibleTransactions: Array<DateTransactionGroup>,
        currentEndIndex: number
      },
      transactionDetails: {
        subcategories: Array<any>
      },
      controlPanel: {
        usersView: boolean,
        selectedUser: Username
      },
      walletList: {
        renameWalletModalVisible: boolean,
        deleteWalletModalVisible: boolean,
        resyncWalletModalVisible: boolean,
        getSeedWalletModalVisible: boolean,
        splitWalletWalletModalVisible: boolean,
        walletArchivesVisible: boolean,
        renameWalletInput: string,
        walletId: string,
        walletName: string,
        privateSeedUnlocked: boolean
      },
      walletTransferList: {
        walletTransferList: Array<any>,
        walletListModalVisible: boolean
      },
      walletListModal: {
        walletListModalVisibility: boolean
      },
      sideMenu: {
        view: boolean
      },
      createWallet: {
        isCreatingWallet: boolean
      },
      editToken: {
        deleteTokenModalVisible: boolean,
        deleteCustomTokenProcessing: boolean,
        editCustomTokenProcessing: boolean
      },
      request: {
        inputCurrencySelected: string,
        receiveAddress: EdgeReceiveAddress
      },
      dimensions: DeviceDimensions,
      helpModal: boolean,
      transactionAlert: {
        displayAlert: boolean,
        abcTransaction: AbcTransaction
      },
      exchangeRate: {
        exchangeRates: {}
      },
      ABAlert: {
        view: boolean,
        route: string,
        syntax: {
          title: string,
          message: string,
          buttons: Array<{ title: string, message: string }>
        }
      },
      requestType: {
        useLegacyAddress: boolean,
        receiveAddress: {},
        uniqueLegacyAddress: boolean
      },
      currentScene: string
    },
    wallets: {
      byId: { [walletId: Id]: GuiWallet },
      activeWalletIds: Array<Id>,
      archivedWalletIds: Array<Id>,
      selectedWalletId: string,
      selectedCurrencyCode: string,
      addTokenPending: boolean,
      manageTokensPending: boolean
    },
    request: {
      receiveAddress: AbcReceiveAddress
    },
    settings: {
      autoLogoutTimeInSeconds: number,
      defaultFiat: string,
      merchantMode: boolean,
      customTokens: Array<any>,
      bluetoothMode: boolean,
      otpMode: boolean,
      pinMode: boolean,
      pinLoginEnabled: boolean,
      changesLocked: true,
      loginStatus: true,
      isTouchSupported: boolean,
      isTouchEnabled: boolean,
      isOtpEnabled: true,
      otpResetPending: false,
      otpKey: string,
      [CurrencyCode]: {
        denomination: string,
        currencyName: string,
        currencyCode: string,
        denominations: Array<AbcDenomination>,
        symbolImage: string,
        symbolImageDarkMono: string
      },
      plugins: {
        arrayPlugins: Array<AbcCurrencyPlugin>,
        supportedWalletTypes: Array<string>,
        [pluginName: string]: AbcCurrencyPlugin
      }
    },
    contacts: {
      contactList: Array<GuiContact>
    }
  },
  cryptoExchange: {
    exchangeRate: number,
    nativeMax: string,
    nativeMin: string,
    minerFee: string,
    reverseExchange: number,
    reverseNativeMax: string,
    reverseNativeMin: string,
    reverseMinerFee: string,
    fromWallet: GuiWallet | null,
    fromCurrencyCode: string | null,
    fromNativeAmount: string,
    fromDisplayAmount: string,
    fromWalletPrimaryInfo: GuiCurrencyInfo, // AbcCurrencyInfo | null,
    fromCurrencyIcon: string | null,
    fromCurrencyIconDark: string | null,
    toWallet: GuiWallet | null,
    toCurrencyCode: string | null,
    toNativeAmount: string,
    toDisplayAmount: string,
    toWalletPrimaryInfo: GuiCurrencyInfo, // AbcCurrencyInfo | null,
    toCurrencyIcon: string | null,
    toCurrencyIconDark: string | null,
    insufficientError: boolean,
    feeSetting: 'low' | 'standard' | 'high' | 'custom',
    walletListModalVisible: boolean,
    confirmTransactionModalVisible: boolean,
    forceUpdateGuiCounter: number,
    shiftTransactionError: Error | null,
    genericShapeShiftError: Error | null,
    changeWallet: 'none',
    transaction: AbcTransaction | null,
    fee: any,
    gettingTransaction: boolean,
    availableShapeShiftTokens: Array<any>,
    shiftPendingTransaction: boolean
  },
  exchangeRates: number,
  permissions: PermissionsState,
  contacts: ContactsState
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A

export type Store = ReduxStore<State, Action>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
