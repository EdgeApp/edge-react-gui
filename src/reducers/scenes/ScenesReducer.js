// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'
import { type ControlPanelState, controlPanel } from '../../modules/UI/components/ControlPanel/reducer.js'
import { type ExchangeRateState, exchangeRate } from '../../modules/UI/components/ExchangeRate/reducer.js'
import { type HelpModalState, helpModal } from '../../modules/UI/components/HelpModal/reducer.js'
import {
  type PasswordRecoveryReminderModalState,
  passwordRecoveryReminderModal
} from '../../modules/UI/components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalReducer.js'
import { type PasswordReminderModalState, passwordReminderModal } from '../../modules/UI/components/PasswordReminderModal/indexPasswordReminderModal.js'
import { type TransactionAlertState, transactionAlert } from '../../modules/UI/components/TransactionAlert/reducer.js'
import { type WalletListModalState, walletListModal } from '../../modules/UI/components/WalletListModal/reducer.js'
import { type DimensionsState, dimensions } from '../DimensionsReducer.js'
import { type EditTokenState, editToken } from '../EditTokenReducer.js'
import { type RequestTypeState, requestType } from '../RequestTypeReducer.js'
import { type UniqueIdentifierModalState, uniqueIdentifierModal } from '../UniqueIdentifierModalReducer.js'
import { type ChangeMiningFeeState, changeMiningFee } from './ChangeMiningFeeReducer.js'
import { type CreateWalletState, createWallet } from './CreateWalletReducer.js'
import { type RequestSceneState, request } from './RequestReducer.js'
import { type ScanState, scan } from './ScanReducer.js'
import { type SendConfirmationState, sendConfirmation } from './SendConfirmationReducer.js'
import { type TransactionDetailsState, transactionDetails } from './TransactionDetailsReducer.js'
import { type TransactionListState, transactionList } from './TransactionListReducer.js'
import { type WalletListState, walletList } from './WalletListReducer.js'
import { type WalletTransferListState, walletTransferList } from './WalletTransferListReducer.js'

export type ScenesState = {
  +changeMiningFee: ChangeMiningFeeState,
  +controlPanel: ControlPanelState,
  +createWallet: CreateWalletState,
  +currentScene: string,
  +dimensions: DimensionsState,
  +editToken: EditTokenState,
  +exchangeRate: ExchangeRateState,
  +helpModal: HelpModalState,
  +passwordRecoveryReminderModal: PasswordRecoveryReminderModalState,
  +passwordReminderModal: PasswordReminderModalState,
  +request: RequestSceneState,
  +requestType: RequestTypeState,
  +scan: ScanState,
  +sendConfirmation: SendConfirmationState,
  +transactionAlert: TransactionAlertState,
  +transactionDetails: TransactionDetailsState,
  +transactionList: TransactionListState,
  +uniqueIdentifierModal: UniqueIdentifierModalState,
  +walletList: WalletListState,
  +walletListModal: WalletListModalState,
  +walletTransferList: WalletTransferListState
}

const currentScene = (state = '', action: Action): string => {
  if (!action.data) return state
  switch (action.type) {
    case 'UPDATE_CURRENT_SCENE_KEY': {
      // $FlowFixMe
      return action.data.sceneKey
    }

    default:
      return state
  }
}

export const scenes: Reducer<ScenesState, Action> = combineReducers({
  changeMiningFee,
  controlPanel,
  createWallet,
  currentScene,
  dimensions,
  editToken,
  exchangeRate,
  helpModal,
  passwordRecoveryReminderModal,
  passwordReminderModal,
  request,
  requestType,
  scan,
  sendConfirmation,
  transactionAlert,
  transactionDetails,
  transactionList,
  uniqueIdentifierModal,
  walletList,
  walletListModal,
  walletTransferList
})
