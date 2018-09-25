// @flow

import { type Reducer, combineReducers } from 'redux'

import { type RequestTypeState, requestType } from '../../../reducers/RequestTypeReducer.js'
import type { Action } from '../../ReduxTypes.js'
import { ABAlert, type ABAlertState } from '../components/ABAlert/reducer.js'
import { type ControlPanelState, controlPanel } from '../components/ControlPanel/reducer.js'
import { type ExchangeRateState, exchangeRate } from '../components/ExchangeRate/reducer.js'
import { type HelpModalState, helpModal } from '../components/HelpModal/reducer.js'
import {
  type PasswordRecoveryReminderModalState,
  passwordRecoveryReminderModal
} from '../components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalReducer.js'
import { type PasswordReminderModalState, passwordReminderModal } from '../components/PasswordReminderModal/indexPasswordReminderModal.js'
import { type TransactionAlertState, transactionAlert } from '../components/TransactionAlert/reducer.js'
import { type WalletListModalState, walletListModal } from '../components/WalletListModal/reducer.js'
import { type DimensionsState, dimensions } from '../dimensions/reducer.js'
import { type ChangeMiningFeeState, changeMiningFee } from './ChangeMiningFee/reducer.js'
import { type CreateWalletState, createWallet } from './CreateWallet/reducer.js'
import { type EditTokenState, editToken } from './EditToken/reducer.js'
import { type RequestSceneState, request } from './Request/reducer.js'
import { type ScanState, scan } from './Scan/reducer.js'
import { type UniqueIdentifierModalState, uniqueIdentifierModal } from './SendConfirmation/components/UniqueIdentifierModal/UniqueIdentifierModalReducer.js'
import { type SendConfirmationState, sendConfirmation } from './SendConfirmation/reducer.js'
import { type TransactionDetailsState, transactionDetails } from './TransactionDetails/reducer.js'
import { type TransactionListState, transactionList } from './TransactionList/reducer.js'
import { type WalletListState, walletList } from './WalletList/reducer.js'
import { type WalletTransferListState, walletTransferList } from './WalletTransferList/reducer.js'

export type ScenesState = {
  +passwordReminderModal: PasswordReminderModalState,
  +uniqueIdentifierModal: UniqueIdentifierModalState,
  +passwordRecoveryReminderModal: PasswordRecoveryReminderModalState,
  +scan: ScanState,
  +sendConfirmation: SendConfirmationState,
  +changeMiningFee: ChangeMiningFeeState,
  +transactionList: TransactionListState,
  +transactionDetails: TransactionDetailsState,
  +controlPanel: ControlPanelState,
  +walletList: WalletListState,
  +walletTransferList: WalletTransferListState,
  +walletListModal: WalletListModalState,
  +createWallet: CreateWalletState,
  +editToken: EditTokenState,
  +request: RequestSceneState,
  +dimensions: DimensionsState,
  +helpModal: HelpModalState,
  +transactionAlert: TransactionAlertState,
  exchangeRate: ExchangeRateState,
  ABAlert: ABAlertState,
  requestType: RequestTypeState,
  currentScene: string
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
  ABAlert,
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
