// @flow
/* eslint-disable no-use-before-define */

import { type EdgeNetworkFee, type EdgeTransaction } from 'edge-core-js'

//
// Action Operations
//
export type ActionOpTypes =
  | 'seq'
  | 'par'
  | 'exchange-buy'
  | 'exchange-sell'
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
export type BroadcastActionOp = {
  type: 'broadcast-tx',
  pluginId: string,
  rawTx: Uint8Array
}
export type ExchangeBuyActionOp = {
  type: 'exchange-buy',
  nativeAmount: string,
  walletId: string,
  tokenId?: string,
  exchangePluginId: string
}
export type ExchangeSellActionOp = {
  type: 'exchange-sell',
  nativeAmount: string,
  walletId: string,
  tokenId?: string,
  exchangePluginId: string
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
// Useful for development/testing
export type ToastActionOp = {
  type: 'toast',
  message: string
}
export type DelayActionOp = {
  type: 'delay',
  ms: number
}
export type ActionOp =
  | SeqActionOp
  | ParActionOp
  | BroadcastActionOp
  | ExchangeBuyActionOp
  | ExchangeSellActionOp
  | LoanBorrowActionOp
  | LoanDepositActionOp
  | LoanRepayActionOp
  | LoanWithdrawActionOp
  | SwapActionOp
  | ToastActionOp
  | DelayActionOp

//
// Action (After) Effects
//

export type SeqEffect = {
  type: 'seq',
  opIndex: number,
  childEffect: ActionEffect | null // null is only for dryrun
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
export type TxConfsEffect = {
  type: 'tx-confs',
  txId: string,
  walletId: string,
  confirmations: number
}
export type PriceLevelEffect = {
  type: 'price-level',
  currencyPair: string,
  aboveRate?: number,
  belowRate?: number
}
export type DoneEffect = {
  type: 'done',
  error?: Error
}
// Useful for development/testing
export type UnixtimeEffect = {
  type: 'unixtime',
  timestamp: number
}
export type NoopEffect = { type: 'noop' }

export type ActionEffect = SeqEffect | ParEffect | AddressBalanceEffect | TxConfsEffect | PriceLevelEffect | DoneEffect | UnixtimeEffect | NoopEffect

//
// Action Program
//

// Storage:
export type ActionProgram = {
  programId: string,
  actionOp: ActionOp
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

//
// Aciton Display API
//

export type ActionDisplayInfo = {
  title: string,
  message: string,
  status: ActionOpExecStatus,
  steps: ActionDisplayInfo[]
}
