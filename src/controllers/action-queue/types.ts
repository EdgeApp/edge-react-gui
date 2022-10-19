import { EdgeAccount, EdgeNetworkFee, EdgeTransaction } from 'edge-core-js'

//
// Action Operations
//
export type ActionOpTypes =
  | 'seq'
  | 'par'
  | 'wyre-buy'
  | 'wyre-sell'
  | 'loan-borrow'
  | 'loan-deposit'
  | 'loan-repay'
  | 'loan-withdraw'
  | 'swap'
  | 'toast'
  | 'delay'

export type SeqActionOp = {
  type: 'seq'
  actions: ActionOp[]
}
export type ParActionOp = {
  type: 'par'
  actions: ActionOp[]
}
export type BroadcastTxActionOp = {
  type: 'broadcast-tx'
  pluginId: string
  rawTx: Uint8Array
}
export type WyreBuyActionOp = {
  type: 'wyre-buy'
  nativeAmount: string
  walletId: string
  tokenId?: string
}
export type WyreSellActionOp = {
  type: 'wyre-sell'
  wyreAccountId: string
  nativeAmount: string
  walletId: string
  tokenId?: string
}
export type LoanBorrowActionOp = {
  type: 'loan-borrow'
  borrowPluginId: string
  nativeAmount: string
  walletId: string
  tokenId?: string
}
export type LoanDepositActionOp = {
  type: 'loan-deposit'
  borrowPluginId: string
  nativeAmount: string
  walletId: string
  tokenId?: string
}
export type LoanRepayActionOp = {
  type: 'loan-repay'
  borrowPluginId: string
  nativeAmount: string
  walletId: string
  tokenId?: string
  fromTokenId?: string
}
export type LoanWithdrawActionOp = {
  type: 'loan-withdraw'
  borrowPluginId: string
  nativeAmount: string
  walletId: string
  tokenId?: string
}
export type SwapActionOp = {
  type: 'swap'
  amountFor: 'from' | 'to'
  fromTokenId?: string
  fromWalletId: string
  nativeAmount: string
  toTokenId?: string
  toWalletId: string
}
export type ActionOp =
  | SeqActionOp
  | ParActionOp
  | BroadcastTxActionOp
  | WyreBuyActionOp
  | WyreSellActionOp
  | LoanBorrowActionOp
  | LoanDepositActionOp
  | LoanRepayActionOp
  | LoanWithdrawActionOp
  | SwapActionOp

//
// Action (After) Effects
//

export type SeqEffect = {
  type: 'seq'
  opIndex: number
  childEffects: Array<ActionEffect | null> // null is only for dryrun
}
export type ParEffect = {
  type: 'par'
  childEffects: Array<ActionEffect | null> // null is only for dryrun
}
export type AddressBalanceEffect = {
  type: 'address-balance'
  address: string
  aboveAmount?: string
  belowAmount?: string
  walletId: string
  tokenId?: string
}
export type PushEventEffect = {
  type: 'push-event'
  eventId: string
  effect?: ActionEffect
}
export type PriceLevelEffect = {
  type: 'price-level'
  currencyPair: string
  aboveRate?: number
  belowRate?: number
}
export type TxConfsEffect = {
  type: 'tx-confs'
  txId: string
  walletId: string
  confirmations: number
}
export type DoneEffect = {
  type: 'done'
  error?: Error
  cancelled?: boolean
}

export type ActionEffect = SeqEffect | ParEffect | AddressBalanceEffect | PushEventEffect | PriceLevelEffect | TxConfsEffect | DoneEffect

//
// Action Program
//

// Storage:
export type ActionProgram = {
  programId: string
  actionOp: ActionOp
  // Development mode flag
  mockMode?: boolean
}
export type ActionProgramState = {
  clientId: string
  programId: string
  effect?: ActionEffect

  // Flags:
  effective: boolean // Whether the effect is observed
  executing: boolean // Whether the program is executing

  lastExecutionTime: number // The time when the effect was checked
  nextExecutionTime: number // The next time when the effect should be checked again
}

export type ActionQueueItem = {
  program: ActionProgram
  state: ActionProgramState
}
export type ActionQueueMap = {
  [id: string]: ActionQueueItem
}

// Runtime:
export type BroadcastTx = {
  walletId: string
  networkFee: EdgeNetworkFee
  tx: EdgeTransaction
}
export type EffectCheckResult = {
  delay: number
  isEffective: boolean
  updatedEffect?: ActionEffect
}
export type ExecutableAction = {
  dryrun: (pendingTxMap: Readonly<PendingTxMap>) => Promise<ExecutionOutput | null>
  execute: () => Promise<ExecutionOutput>
}
export type ExecutionContext = {
  account: EdgeAccount
  clientId: string

  // Methods
  evaluateAction: (program: ActionProgram, state: ActionProgramState) => Promise<ExecutableAction>
  checkActionEffect: (effect: ActionEffect) => Promise<EffectCheckResult>
}
export type ExecutionOutput = {
  effect: ActionEffect
  broadcastTxs: BroadcastTx[]
}
export type ExecutionResults = {
  nextState: ActionProgramState
}
export type PendingTxMap = {
  [walletId: string]: EdgeTransaction[] | undefined
}

//
// Action Display API
//

export type ActionDisplayStatus = 'pending' | 'active' | 'done' | Error

export type ActionDisplayInfo = {
  title: string
  message: string
  status: ActionDisplayStatus
  steps: ActionDisplayInfo[]
}
