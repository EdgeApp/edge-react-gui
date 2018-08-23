// @flow

import type { DiskletFolder, EdgeAccount, EdgeContext, EdgeCurrencyWallet, EdgeLobby, EdgeParsedUri, EdgeTransaction } from 'edge-core-js'
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'

import type { ContactsState } from '../reducers/contacts/contactsReducer.js'
import type { PasswordReminderState } from '../reducers/passwordReminder/indexPasswordReminder.js'
import type { PermissionsState } from '../reducers/permissions/permissionsReducer.js'
import type { DeviceDimensions, GuiContact, GuiCurrencyInfo, GuiWallet, TransactionListTx } from '../types'
import type { PasswordReminderModalState } from './UI/components/PasswordReminderModal/indexPasswordReminderModal.js'
import type { Permission, PermissionStatus } from './UI/permissions.js'
import type { RequestState } from './UI/Request/reducer.js'
import type { RequestSceneState } from './UI/scenes/Request/reducer.js'
import type { SendConfirmationState } from './UI/scenes/SendConfirmation/selectors.js'
import type { SettingsState } from './UI/Settings/reducer.js'

export type Action = { type: string, data?: any }

export type CurrencyCode = string
export type Id = string
export type Username = string
export type { PermissionsState, PermissionStatus, Permission }

export type State = {
  core: {
    account: EdgeAccount,
    context: {
      context: EdgeContext,
      folder: DiskletFolder,
      usernames: Array<Username>,
      nextUsername: Username
    },
    wallets: {
      byId: {
        [Id]: EdgeCurrencyWallet
      }
    },
    edgeLogin: {
      lobby: EdgeLobby | null,
      error: Error | null,
      isProcessing: boolean
    },
    deepLinking: {
      passwordRecoveryLink: string | null
    }
  },
  ui: {
    passwordReminder: PasswordReminderState,
    errorAlert: {
      displayAlert: boolean,
      message: string
    },
    transactionAlert: {
      displayAlert: boolean,
      edgeTransaction: EdgeTransaction
    },
    scenes: {
      passwordReminderModal: PasswordReminderModalState,
      uniqueIdentifierModal: {
        isActive: boolean,
        uniqueIdentifier: string
      },
      scan: {
        parsedUri: EdgeParsedUri | null,
        torchEnabled: boolean,
        addressModalVisible: boolean,
        scanEnabled: boolean,
        selectedWalletListModalVisibility: boolean,
        scanToWalletListModalVisibility: boolean,
        legacyAddressModal: {
          isActive: boolean
        },
        privateKeyModal: {
          primaryModal: {
            isActive: boolean
          },
          secondaryModal: {
            isActive: boolean
          },
          error: Error | null,
          isSweeping: boolean
        }
      },
      sendConfirmation: SendConfirmationState,
      changeMiningFee: {
        isCustomFeeVisible: boolean
      },
      transactionList: {
        transactions: Array<TransactionListTx>,
        contactsList: Array<GuiContact>,
        updatingBalance: boolean,
        searchVisible: boolean,
        currentCurrencyCode: string,
        currentWalletId: string,
        numTransactions: number,
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
        privateSeedUnlocked: boolean,
        xPubSyntax: string,
        viewXPubWalletModalVisible: boolean
      },
      walletTransferList: {
        walletTransferList: Array<any>,
        walletListModalVisible: boolean
      },
      walletListModal: {
        walletListModalVisible: boolean
      },
      createWallet: {
        isCreatingWallet: boolean
      },
      editToken: {
        deleteTokenModalVisible: boolean,
        deleteCustomTokenProcessing: boolean,
        editCustomTokenProcessing: boolean
      },
      request: RequestSceneState,
      dimensions: DeviceDimensions,
      helpModal: boolean,
      transactionAlert: {
        displayAlert: boolean,
        edgeTransaction: EdgeTransaction
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
      manageTokensPending: boolean,
      walletLoadingProgress: { [walletId: string]: number }
    },
    request: RequestState,
    settings: SettingsState
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
    fromWalletPrimaryInfo: GuiCurrencyInfo, // EdgeCurrencyInfo | null,
    fromCurrencyIcon: string | null,
    fromCurrencyIconDark: string | null,
    toWallet: GuiWallet | null,
    toCurrencyCode: string | null,
    toNativeAmount: string,
    toDisplayAmount: string,
    toWalletPrimaryInfo: GuiCurrencyInfo, // EdgeCurrencyInfo | null,
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
    transaction: EdgeTransaction | null,
    fee: any,
    gettingTransaction: boolean,
    availableShapeShiftTokens: Array<any>,
    shiftPendingTransaction: boolean,
    quoteExpireDate: number | null
  },
  exchangeRates: number,
  permissions: PermissionsState,
  contacts: ContactsState
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A

export type Reducer<S, A: Action> = (S, A) => S

export type Store = ReduxStore<State, Action>
export type Next = $PropertyType<Store, 'dispatch'>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
