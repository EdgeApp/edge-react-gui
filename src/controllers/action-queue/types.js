// @flow
/* eslint-disable no-use-before-define */

import { type EdgeNetworkFee, type EdgeTransaction } from 'edge-core-js'

//
// Action Operations
//
export type ActionOpTypes =
  | 'seq'
  | 'par'
  | 'fiat-buy'
  | 'fiat-sell'
  | 'loan-borrow'
  | 'loan-deposit'
  | 'loan-repay'
  | 'loan-withdraw'
  | 'swap'
  | 'toast'
  | 'delay'

export type ActionOpExecStatus = 'pending' | 'active' | 'done' | Error

export type SeqActionOp = {
  type: 'seq',
  actions: ActionOp[]
}
export type ParActionOp = {
  type: 'par',
  actions: ActionOp[]
}
export type BroadcastTxActionOp = {
  type: 'broadcast-tx',
  pluginId: string,
  rawTx: Uint8Array
}
export type FiatBuyActionOp = {
  type: 'fiat-buy',
  fiatPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type FiatSellActionOp = {
  type: 'fiat-sell',
  fiatPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type LoanBorrowActionOp = {
  type: 'loan-borrow',
  borrowPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type LoanDepositActionOp = {
  type: 'loan-deposit',
  borrowPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type LoanRepayActionOp = {
  type: 'loan-repay',
  borrowPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type LoanWithdrawActionOp = {
  type: 'loan-withdraw',
  borrowPluginId: string,
  nativeAmount: string,
  walletId: string,
  tokenId?: string
}
export type SwapActionOp = {
  type: 'swap',
  fromWalletId: string,
  toWalletId: string,
  fromTokenId?: string,
  toTokenId?: string,
  nativeAmount: string,
  amountFor: 'from' | 'to'
}
export type ActionOp =
  | SeqActionOp
  | ParActionOp
  | BroadcastTxActionOp
  | FiatBuyActionOp
  | FiatSellActionOp
  | LoanBorrowActionOp
  | LoanDepositActionOp
  | LoanRepayActionOp
  | LoanWithdrawActionOp
  | SwapActionOp

//
// Action (After) Effects
//

export type SeqEffect = {
  type: 'seq',
  opIndex: number,
  childEffects: Array<ActionEffect | null> // null is only for dryrun
}
export type ParEffect = {
  type: 'par',
  childEffects: Array<ActionEffect | null> // null is only for dryrun
}
export type AddressBalanceEffect = {
  type: 'address-balance',
  address: string,
  aboveAmount?: string,
  belowAmount?: string,
  walletId: string,
  tokenId?: string
}
export type PushEventEffect = {
  type: 'push-event',
  eventId: string
}
export type PriceLevelEffect = {
  type: 'price-level',
  currencyPair: string,
  aboveRate?: number,
  belowRate?: number
}
export type TxConfsEffect = {
  type: 'tx-confs',
  txId: string,
  walletId: string,
  confirmations: number
}
export type DoneEffect = {
  type: 'done',
  error?: Error
}

export type ActionEffect = SeqEffect | ParEffect | AddressBalanceEffect | PushEventEffect | PriceLevelEffect | TxConfsEffect | DoneEffect

//
// Action Program
//

// Storage:
export type ActionProgram = {
  programId: string,
  actionOp: ActionOp,
  // Development mode flag
  mockMode?: boolean
}
export type ActionProgramState = {
  deviceId: string,
  programId: string,
  effect?: ActionEffect
}

export type ActionQueueItem = {
  program: ActionProgram,
  state: ActionProgramState
}
export type ActionQueueMap = {
  [id: string]: ActionQueueItem
}

// Runtime:
export type BroadcastTx = {
  walletId: string,
  networkFee: EdgeNetworkFee,
  tx: EdgeTransaction
}
export type ExecutableAction = {
  dryrunOutput: ExecutionOutput | null,
  execute(): Promise<ExecutionOutput>
}
export type ExecutionOutput = {
  effect: ActionEffect,
  broadcastTxs: BroadcastTx[]
}
export type ExecutionResults = {
  nextState: ActionProgramState
}
export type PendingTxMap = {
  [walletId: string]: EdgeTransaction[]
}

//
// Aciton Display API
//

export type ActionDisplayInfo = {
  title: string,
  message: string,
  status: ActionOpExecStatus,
  steps: ActionDisplayInfo[]
}
