// @flow

import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type {
  AbcContext,
  AbcCurrencyWallet,
  AbcAccount,
  AbcLobby,
  AbcTransaction,
  AbcParsedUri,
  // AbcCurrencyInfo,
  AbcReceiveAddress // ,
 } from 'airbitz-core-types'

import type {
  DeviceDimensions,
  // GuiWallet,
  GuiContact
} from '../types'

export type Action = { type: string, data?: any }

export type CurrencyCode = string
export type Id = string
export type Username = string

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
        displayAmount: number,
        publicAddress: string,
        feeSatoshi: number,
        label: string,
        feeSetting: 'low' | 'standard' | 'high' | 'custom',
        inputCurrencySelected: string,
        maxSatoshi: number,
        isPinEnabled: boolean,
        isSliderLocked: boolean,
        draftStatus: 'over' | 'under',
        isKeyboardVisible: boolean,
        pending: boolean
      },
      transactionList: {
        transactions: Array<AbcTransaction>,
        contactsList: Array<GuiContact>,
        updatingBalance: boolean,
        searchVisible: boolean
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
        receiveAddress: AbcReceiveAddress
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
          buttons: Array<any>
        }
      },
    },
    wallets: any,
    request: any,
    settings: any,
    locale: any,
    contacts: any
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
    fromWallet: any, // GuiWallet | null,
    fromCurrencyCode: any, // CurrencyCode | null,
    fromNativeAmount: string,
    fromDisplayAmount: string,
    fromWalletPrimaryInfo: any, // AbcCurrencyInfo | null,
    fromCurrencyIcon: string | null,
    fromCurrencyIconDark: string | null,
    toWallet: any, // GuiWallet | null,
    toCurrencyCode: any, // CurrencyCode | null,
    toNativeAmount: string,
    toDisplayAmount: string,
    toWalletPrimaryInfo: any, // AbcCurrencyInfo | null,
    toCurrencyIcon: string | null,
    toCurrencyIconDark: string | null,
    insufficientError: boolean,
    feeSetting: 'low' | 'standard' | 'high' | 'custom',
    walletListModalVisible: boolean,
    confirmTransactionModalVisible: boolean,
    shiftTransactionError: Error | null,
    genericShapeShiftError: Error | null,
    changeWallet: 'none',
    transaction: AbcTransaction | null,
    fee: any
  },
  exchangeRates: number
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A

export type Store = ReduxStore<State, Action>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
