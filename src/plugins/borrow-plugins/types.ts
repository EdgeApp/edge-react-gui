import { EdgeCurrencyWallet, EdgeNetworkFee, EdgeTransaction } from 'edge-core-js'
import { Subscriber } from 'yaob'

// -----------------------------------------------------------------------------
// Request Method Types
// -----------------------------------------------------------------------------

// Borrow more:
export type BorrowRequest = {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will borrow on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet

  // Optional pending txs to pass along to the wallet when making transactions
  pendingTxs?: EdgeTransaction[]
}

// Make payment:
export type RepayRequest = {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will repay on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet

  // Optional pending txs to pass along to the wallet when making transactions
  pendingTxs?: EdgeTransaction[]
}

// Deposit collateral:
export type DepositRequest = {
  tokenId?: string
  nativeAmount: string

  // Optional source for the funds which will deposit on behalf of the borrow engine's currencyWallet
  fromWallet?: EdgeCurrencyWallet

  // Optional pending txs to pass along to the wallet when making transactions
  pendingTxs?: EdgeTransaction[]
}

// Withdraw collateral:
export type WithdrawRequest = {
  tokenId?: string
  nativeAmount: string

  // Optional destination for the funds
  toWallet?: EdgeCurrencyWallet

  // Optional pending txs to pass along to the wallet when making transactions
  pendingTxs?: EdgeTransaction[]
}

export type BroadcastTx = {
  walletId: string
  networkFee: EdgeNetworkFee
  tx: EdgeTransaction
}

// General purpose approvable action
export type ApprovableAction = {
  readonly networkFee: EdgeNetworkFee
  readonly unsignedTxs: EdgeTransaction[]
  readonly dryrun: () => Promise<BroadcastTx[]>
  readonly approve: () => Promise<BroadcastTx[]>
}

// HACK: Used to identify running ActionQueue programs by borrow action type.
export type BorrowActionId = 'loan-create' | 'loan-deposit' | 'loan-borrow' | 'loan-repay' | 'loan-withdraw'

// -----------------------------------------------------------------------------
// Engine
// -----------------------------------------------------------------------------

export type BorrowCollateral = {
  tokenId?: string
  nativeAmount: string
}

export type BorrowDebt = {
  tokenId?: string
  nativeAmount: string
  apr: number
}

export type BorrowEngine = {
  // Currency wallet for the loan account (e.g. Ethereum wallet)
  currencyWallet: EdgeCurrencyWallet

  collaterals: BorrowCollateral[]
  debts: BorrowDebt[]

  loanToValue: number

  readonly watch: Subscriber<BorrowEngine>
  syncRatio: number

  // Returns the APR for borrow a particular token
  getAprQuote: (tokenId?: string) => Promise<number>

  // Collateral modification
  deposit: (request: DepositRequest) => Promise<ApprovableAction>
  withdraw: (request: WithdrawRequest) => Promise<ApprovableAction>

  // Debt modification
  borrow: (request: BorrowRequest) => Promise<ApprovableAction>
  repay: (request: RepayRequest) => Promise<ApprovableAction>

  // Close loan account
  close: () => Promise<ApprovableAction>
}

// -----------------------------------------------------------------------------
// Plugin Info
// -----------------------------------------------------------------------------

export type BorrowPluginInfo = {
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

export type BorrowPlugin = {
  borrowInfo: BorrowPluginInfo
  makeBorrowEngine: (wallet: EdgeCurrencyWallet) => Promise<BorrowEngine>
}
