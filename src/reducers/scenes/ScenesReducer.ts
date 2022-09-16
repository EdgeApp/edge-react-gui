import { combineReducers, Reducer } from 'redux'

import { fioAddress, FioAddressSceneState } from '../../modules/FioAddress/reducer'
import { Action } from '../../types/reduxTypes'
import { requestType, RequestTypeState } from '../RequestTypeReducer'
import { createWallet, CreateWalletState } from './CreateWalletReducer'
import { sendConfirmation, SendConfirmationState } from './SendConfirmationReducer'
import { transactionDetails, TransactionDetailsState } from './TransactionDetailsReducer'
import { transactionList, TransactionListState } from './TransactionListReducer'

export type ScenesState = {
  readonly createWallet: CreateWalletState
  readonly fioAddress: FioAddressSceneState
  readonly requestType: RequestTypeState
  readonly sendConfirmation: SendConfirmationState
  readonly transactionDetails: TransactionDetailsState
  readonly transactionList: TransactionListState
}

export const scenes: Reducer<ScenesState, Action> = combineReducers({
  createWallet,
  fioAddress,
  requestType,
  sendConfirmation,
  transactionDetails,
  transactionList
})
