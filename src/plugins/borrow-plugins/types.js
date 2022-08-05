// @flow

import { type EdgeCurrencyWallet, type EdgeNetworkFee, type EdgeTransaction } from 'edge-core-js'

// -----------------------------------------------------------------------------
// Request Method Types
// -----------------------------------------------------------------------------

// Borrow more:
export type BorrowRequest = {
  tokenId?: string,
  nativeAmount: string,

  // Optional source for the funds which will borrow on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
}

// Make payment:
export type RepayRequest = {
  tokenId?: string,
  nativeAmount: string,

  // Optional source for the funds which will repay on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
}

// Deposit collateral:
export type DepositRequest = {
  tokenId?: string,
  nativeAmount: string,

  // Optional source for the funds which will deposit on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
}

// Withdraw collateral:
export type WithdrawRequest = {
  tokenId?: string,
  nativeAmount: string,

  // Optional destination for the funds
  toWallet?: EdgeCurrencyWallet
}

// General purpose approvable action
export type ApprovableAction = {
  +networkFee: EdgeNetworkFee,
  +unsignedTxs: EdgeTransaction[],
  +approve: () => Promise<EdgeTransaction[]>
}

// HACK: Used to identify running ActionQueue programs by borrow action type.
export type BorrowActionId = 'loan-create' | 'loan-deposit' | 'loan-borrow' | 'loan-repay' | 'loan-withdraw'

// -----------------------------------------------------------------------------
// Engine
// -----------------------------------------------------------------------------

export type BorrowCollateral = {
  tokenId?: string,
  nativeAmount: string
}

export type BorrowDebt = {
  tokenId?: string,
  nativeAmount: string,
  apr: number
}

export type BorrowEngine = {
  // Currency wallet for the loan account (e.g. Ethereum wallet)
  currencyWallet: EdgeCurrencyWallet,

  collaterals: BorrowCollateral[],
  debts: BorrowDebt[],

  loanToValue: number,

  // Returns the APR for borrow a particular token
  getAprQuote: (tokenId?: string) => Promise<number>,

  // Collateral modification
  deposit: (request: DepositRequest) => Promise<ApprovableAction>,
  withdraw: (request: WithdrawRequest) => Promise<ApprovableAction>,

  // Debt modification
  borrow: (request: BorrowRequest) => Promise<ApprovableAction>,
  repay: (request: RepayRequest) => Promise<ApprovableAction>,

  // Close loan account
  close: () => Promise<ApprovableAction>
}

// -----------------------------------------------------------------------------
// Plugin Info
// -----------------------------------------------------------------------------

export type BorrowPluginInfo = {
  pluginId: string,
  displayName: string,

  // Defines the relationship to the type of currency plugins which the plugin supports
  currencyPluginId: string,

  // Maximum loan-to-value ratio
  maxLtvRatio: number
}

// -----------------------------------------------------------------------------
// Plugin
// -----------------------------------------------------------------------------

export type BorrowPlugin = {
  borrowInfo: BorrowPluginInfo,
  makeBorrowEngine: (wallet: EdgeCurrencyWallet) => Promise<BorrowEngine>
}
