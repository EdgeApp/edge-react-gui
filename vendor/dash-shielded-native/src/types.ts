export type Network = 'mainnet' | 'testnet'

export interface ViewingKeySet {
  fullViewingKey: string
}

export interface InitializerConfig {
  network: Network
  seedHex?: string
  mnemonicSeed?: string
  account: number
  alias: string
  dataDir: string
  defaultHost: string
  defaultPort: number
}

export interface ProposeTransferOpts {
  toAddress: string
  amountCredits: string
  memo?: string
}

export interface CreateTransferOpts {
  proposalId: string
  mnemonicSeed: string
}

export interface ProposalSuccess {
  proposalId: string
  feeCredits: string
}

export interface SpendSuccess {
  txid: string
}

export interface SpendFailure {
  errorMessage?: string
}

export interface BalanceEvent {
  availableCredits: string
  totalCredits: string
}

export interface StatusEvent {
  alias: string
  name: 'STOPPED' | 'DISCONNECTED' | 'SYNCING' | 'SYNCED'
}

export interface DashShieldedTx {
  txid: string
  blockTimeInSeconds: number
  minedHeight: number
  value: string
  fee?: string
  toAddress?: string
  memos: string[]
}

export interface TransactionEvent {
  transactions: DashShieldedTx[]
}

export interface UpdateEvent {
  alias: string
  scanProgress: number
  networkBlockHeight: number
}

export interface ErrorEvent {
  alias: string
  level: 'critical' | 'error'
  message: string
}

export interface SynchronizerCallbacks {
  onBalanceChanged(balance: BalanceEvent): void
  onStatusChanged(status: StatusEvent): void
  onTransactionsChanged(transactions: TransactionEvent): void
  onUpdate(event: UpdateEvent): void
  onError(error: ErrorEvent): void
}

export interface Addresses {
  shieldedAddress: string
}
