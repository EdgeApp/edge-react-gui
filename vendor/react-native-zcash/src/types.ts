export type Network = 'mainnet' | 'testnet'

export interface InitializerConfig {
  networkName: Network
  defaultHost: string
  defaultPort: number
  mnemonicSeed: string
  alias: string
  birthdayHeight: number
  newWallet: boolean
}

export interface ProposeTransferOpts {
  zatoshi: string
  toAddress: string
  memo?: string
}

export interface CreateTransferOpts {
  mnemonicSeed: string
  proposalBase64: string
}

export interface ShieldFundsInfo {
  seed: string
  memo: string
  threshold: string
}

export interface ProposalSuccess {
  proposalBase64: string
  transactionCount: number
  totalFee: string
}

export interface SpendSuccess {
  txId: string
  raw: string
}

export interface SpendFailure {
  errorMessage?: string
  errorCode?: string
}

export interface BalanceEvent {
  transparentAvailableZatoshi: string
  transparentTotalZatoshi: string
  saplingAvailableZatoshi: string
  saplingTotalZatoshi: string
  orchardAvailableZatoshi: string
  orchardTotalZatoshi: string
  /** Zero until the Ironwood (NU6.3) pool activates. */
  ironwoodAvailableZatoshi: string
  ironwoodTotalZatoshi: string

  /** @deprecated Sum of every pool, including ironwood */
  availableZatoshi: string
  totalZatoshi: string
}

export interface StatusEvent {
  alias: string
  name:
    | 'STOPPED' /** Indicates that [stop] has been called on this Synchronizer and it will no longer be used. */
    | 'DISCONNECTED' /** Indicates that this Synchronizer is disconnected from its lightwalletd server. When set, a UI element may want to turn red. */
    | 'SYNCING' /** Indicates that this Synchronizer is actively downloading and scanning new blocks */
    | 'SYNCED' /** Indicates that this Synchronizer is fully up to date and ready for all wallet functions. When set, a UI element may want to turn green. In this state, the balance can be trusted. */
}

export interface TransactionEvent {
  transactions: Transaction[]
}

export interface UpdateEvent {
  alias: string
  scanProgress: number // 0 - 100 (may include decimal places)
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

export interface BlockRange {
  first: number
  last: number
}

export interface Transaction {
  rawTransactionId: string
  raw?: string
  blockTimeInSeconds: number
  minedHeight: number
  value: string
  fee?: string
  toAddress?: string
  isShielding: boolean
  isExpired: boolean
  memos: string[]
}

/** @deprecated Renamed `Transaction` because the package can now return unconfirmed shielding transactions */
export type ConfirmedTransaction = Transaction

export interface Addresses {
  unifiedAddress: string
  saplingAddress: string
  transparentAddress: string
}

//
// Orchard -> Ironwood migration (NU6.3).
//
// The sweep is one ordinary proposal the app signs through createTransfer
// and broadcasts through broadcastTransfer, so there is no migration
// lifecycle to model here: the app decides whether to offer it from the
// Orchard balance and the activation height, and a broadcast sweep empties
// that balance.
//

/**
 * The Orchard-only sweep: spends every Orchard note to the wallet's own
 * address, with the fee chosen so no Orchard change remains. Sapling and
 * transparent funds are untouched, and it is all-or-nothing — post-NU6.3 the
 * turnstile forbids adding value back to Orchard, so a remainder would be
 * stranded.
 */
export interface ImmediateMigrationProposal {
  /**
   * Net amount crossing into Ironwood: the spendable Orchard balance minus
   * `feeZatoshi`. It deliberately excludes the wallet's other pools.
   */
  amountZatoshi: string
  feeZatoshi: string
  /** Opaque ordinary-transfer proposal; sign it via createTransfer. */
  proposalBase64: string
}
