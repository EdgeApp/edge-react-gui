// @flow

import { type Reducer, combineReducers } from 'redux'

import { type ControlPanelState, controlPanel } from '../../modules/UI/components/ControlPanel/reducer.js'
import { type ExchangeRateState, exchangeRate } from '../../modules/UI/components/ExchangeRate/reducer.js'
import {
  type PasswordRecoveryReminderModalState,
  passwordRecoveryReminderModal
} from '../../modules/UI/components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalReducer.js'
import { type PasswordReminderModalState, passwordReminderModal } from '../../modules/UI/components/PasswordReminderModal/indexPasswordReminderModal.js'
import type { Action } from '../../types/reduxTypes.js'
import { type EditTokenState, editToken } from '../EditTokenReducer.js'
import { type RequestTypeState, requestType } from '../RequestTypeReducer.js'
import { type UniqueIdentifierModalState, uniqueIdentifierModal } from '../UniqueIdentifierModalReducer.js'
import { type CreateWalletState, createWallet } from './CreateWalletReducer.js'
import { type RequestSceneState, request } from './RequestReducer.js'
import { type ScanState, scan } from './ScanReducer.js'
import { type SendConfirmationState, sendConfirmation } from './SendConfirmationReducer.js'
import { type TransactionDetailsState, transactionDetails } from './TransactionDetailsReducer.js'
import { type TransactionListState, transactionList } from './TransactionListReducer.js'
import { type WalletListState, walletList } from './WalletListReducer.js'

export type ScenesState = {
  +controlPanel: ControlPanelState,
  +createWallet: CreateWalletState,
  +editToken: EditTokenState,
  +exchangeRate: ExchangeRateState,
  +passwordRecoveryReminderModal: PasswordRecoveryReminderModalState,
  +passwordReminderModal: PasswordReminderModalState,
  +request: RequestSceneState,
  +requestType: RequestTypeState,
  +scan: ScanState,
  +sendConfirmation: SendConfirmationState,
  +transactionDetails: TransactionDetailsState,
  +transactionList: TransactionListState,
  +uniqueIdentifierModal: UniqueIdentifierModalState,
  +walletList: WalletListState
}

export const scenes: Reducer<ScenesState, Action> = combineReducers({
  controlPanel,
  createWallet,
  editToken,
  exchangeRate,
  passwordRecoveryReminderModal,
  passwordReminderModal,
  request,
  requestType,
  scan,
  sendConfirmation,
  transactionDetails,
  transactionList,
  uniqueIdentifierModal,
  walletList
})
