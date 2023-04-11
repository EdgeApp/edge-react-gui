import { combineReducers } from 'redux'

import { Action } from '../../types/reduxTypes'
import { createWallet, CreateWalletState } from './CreateWalletReducer'
import { fioAddress, FioAddressSceneState } from './FioAddressSceneReducer'
import { sendConfirmation, SendConfirmationState } from './SendConfirmationReducer'
import { transactionDetails, TransactionDetailsState } from './TransactionDetailsReducer'
import { transactionList, TransactionListState } from './TransactionListReducer'

export interface ScenesState {
  readonly createWallet: CreateWalletState
  readonly fioAddress: FioAddressSceneState
  readonly sendConfirmation: SendConfirmationState
  readonly transactionDetails: TransactionDetailsState
  readonly transactionList: TransactionListState
}

export const scenes = combineReducers<ScenesState, Action>({
  createWallet,
  fioAddress,
  sendConfirmation,
  transactionDetails,
  transactionList
})
