// @flow

import { type Reducer, combineReducers } from 'redux'

import { type FioAddressSceneState, fioAddress } from '../../modules/FioAddress/reducer.js'
import type { Action } from '../../types/reduxTypes.js'
import { type RequestTypeState, requestType } from '../RequestTypeReducer.js'
import { type CreateWalletState, createWallet } from './CreateWalletReducer.js'
import { type SendConfirmationState, sendConfirmation } from './SendConfirmationReducer.js'
import { type TransactionDetailsState, transactionDetails } from './TransactionDetailsReducer.js'
import { type TransactionListState, transactionList } from './TransactionListReducer.js'

export type ScenesState = {
  +createWallet: CreateWalletState,
  +fioAddress: FioAddressSceneState,
  +requestType: RequestTypeState,
  +sendConfirmation: SendConfirmationState,
  +transactionDetails: TransactionDetailsState,
  +transactionList: TransactionListState
}

export const scenes: Reducer<ScenesState, Action> = combineReducers({
  createWallet,
  fioAddress,
  requestType,
  sendConfirmation,
  transactionDetails,
  transactionList
})
