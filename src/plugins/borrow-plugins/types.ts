import { EdgeCurrencyWallet, EdgeNetworkFee, EdgeTransaction } from 'edge-core-js'
import { Subscriber } from 'yaob'

import { PendingTxMap } from '../../controllers/action-queue/types'

// -----------------------------------------------------------------------------
// Request Method Types
// -----------------------------------------------------------------------------

// Borrow more:
export interface BorrowRequest {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will borrow on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
}

// Make payment:
export interface RepayRequest {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will repay on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
  fromTokenId?: string
}

// Deposit collateral:
export interface DepositRequest {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will deposit on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet
}

// Withdraw collateral:
export interface WithdrawRequest {
  tokenId?: string
  nativeAmount: string

  // Optional destination for the funds
  toWallet?: EdgeCurrencyWallet
}

// Calculate projected LTV:
export interface CalculateLtvRequest {
  collaterals: BorrowCollateral[]
  debts: BorrowDebt[]
}

export interface BroadcastTx {
  walletId: string
  networkFee: EdgeNetworkFee
  tx: EdgeTransaction
}

// General purpose approvable action
export interface ApprovableAction {
  readonly networkFee: EdgeNetworkFee
  readonly unsignedTxs: EdgeTransaction[]
  // Optional pending txs to pass along to the wallet when making transactions
  readonly dryrun: (pendingTxMap: Readonly<PendingTxMap>) => Promise<BroadcastTx[]>
  readonly approve: () => Promise<BroadcastTx[]>
}

// HACK: Used to identify running ActionQueue programs by borrow action type.
export type BorrowActionId = 'loan-create' | 'loan-deposit' | 'loan-borrow' | 'loan-repay' | 'loan-withdraw'

// -----------------------------------------------------------------------------
// Engine
// -----------------------------------------------------------------------------

export interface BorrowCollateral {
  tokenId?: string
  nativeAmount: string
}

export interface BorrowDebt {
  tokenId?: string
  nativeAmount: string
  apr: number
}

export interface BorrowEngine {
  // Currency wallet for the loan account (e.g. Ethereum wallet)
  currencyWallet: EdgeCurrencyWallet

  // Loan State
  collaterals: BorrowCollateral[]
  debts: BorrowDebt[]
  loanToValue: number

  // Engine State
  readonly watch: Subscriber<BorrowEngine>
  isRunning: boolean
  syncRatio: number

  // Life-cycle
  startEngine: () => Promise<void>
  stopEngine: () => Promise<void>

  // Collateral modification
  deposit: (request: DepositRequest) => Promise<ApprovableAction>
  withdraw: (request: WithdrawRequest) => Promise<ApprovableAction>

  // Debt modification
  borrow: (request: BorrowRequest) => Promise<ApprovableAction>
  repay: (request: RepayRequest) => Promise<ApprovableAction>

  // Utilities:

  // Returns the APR for borrow a particular token
  getAprQuote: (tokenId?: string) => Promise<number>

  // Calculates projected LTV after making a debt or collateral modification
  calculateProjectedLtv: (request: CalculateLtvRequest) => Promise<string>
}

// -----------------------------------------------------------------------------
// Plugin Info
// -----------------------------------------------------------------------------

export interface BorrowPluginInfo {
  borrowPluginId: string

  // Display information
  displayName: string
  // A token from the currencyPluginId, for displaying as the Loan provider icon
  displayTokenId: string

  // Defines the relationship to the of currency plugins which the plugin supports
  currencyPluginId: string

  // Maximum loan-to-value ratio
  maxLtvRatio: number
}

// -----------------------------------------------------------------------------
// Plugin
// -----------------------------------------------------------------------------

export interface BorrowPlugin {
  borrowInfo: BorrowPluginInfo
  makeBorrowEngine: (wallet: EdgeCurrencyWallet) => Promise<BorrowEngine>
}
