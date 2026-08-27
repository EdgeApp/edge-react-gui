import type {
  Addresses,
  BalanceEvent,
  CreateTransferOpts,
  ErrorEvent,
  ImmediateMigrationProposal,
  InitializerConfig,
  ProposalSuccess,
  ProposeTransferOpts,
  ShieldFundsInfo,
  SpendFailure,
  SpendSuccess,
  StatusEvent,
  SynchronizerCallbacks,
  Tools,
  TransactionEvent,
  UpdateEvent
} from 'react-native-zcash'
import { bridgifyObject, emit, onMethod, Subscriber } from 'yaob'

export interface ZcashEvents {
  balanceChanged: BalanceEvent
  error: ErrorEvent
  statusChanged: StatusEvent
  transactionsChanged: TransactionEvent
  update: UpdateEvent
}

export interface ZcashSynchronizer {
  on: Subscriber<ZcashEvents>
  createTransfer: (
    opts: CreateTransferOpts
  ) => Promise<SpendSuccess | SpendFailure>
  broadcastTransfer: (txid: string) => Promise<string>
  deriveUnifiedAddress: () => Promise<Addresses>
  proposeTransfer: (opts: ProposeTransferOpts) => Promise<ProposalSuccess>
  proposeFulfillingPaymentURI: (paymentUri: string) => Promise<ProposalSuccess>
  rescan: () => Promise<void>
  shieldFunds: (shieldFundsInfo: ShieldFundsInfo) => Promise<string>
  stop: () => Promise<string>

  // Orchard -> Ironwood migration (NU6.3). The sweep is one ordinary proposal
  // the app signs through createTransfer and broadcasts through
  // broadcastTransfer, except Ironwood itself stays fused in createTransfer:
  // the SDK spends every Orchard note to the wallet's own address with the
  // fee chosen so no Orchard change remains, leaving the other pools
  // untouched. Deliberately not a plain max send, which would drag Sapling
  // funds across the turnstile too.
  proposeOrchardToIronwoodMigration: () => Promise<ImmediateMigrationProposal>
}

export interface ZcashIo {
  readonly Tools: typeof Tools
  readonly makeSynchronizer: (
    config: InitializerConfig
  ) => Promise<ZcashSynchronizer>
}

/**
 * RN and Node Synchronizer classes share this method surface; Node has no
 * NativeEventEmitter fields.
 */
export interface NativeZcashSynchronizer {
  subscribe: (callbacks: SynchronizerCallbacks) => void
  deriveUnifiedAddress: () => Promise<Addresses>
  rescan: () => Promise<void>
  proposeTransfer: (opts: ProposeTransferOpts) => Promise<ProposalSuccess>
  proposeFulfillingPaymentURI: (paymentUri: string) => Promise<ProposalSuccess>
  createTransfer: (
    opts: CreateTransferOpts
  ) => Promise<SpendSuccess | SpendFailure>
  broadcastTransfer: (txid: string) => Promise<string>
  shieldFunds: (info: ShieldFundsInfo) => Promise<string>
  stop: () => Promise<string>
  proposeOrchardToIronwoodMigration: () => Promise<ImmediateMigrationProposal>
}

export function wrapZcashNative(rnzcash: {
  Tools: typeof Tools
  makeSynchronizer: (
    config: InitializerConfig
  ) => Promise<NativeZcashSynchronizer>
}): ZcashIo {
  return bridgifyObject<ZcashIo>({
    Tools: bridgifyObject(rnzcash.Tools),

    async makeSynchronizer(config) {
      const realSynchronizer: NativeZcashSynchronizer =
        await rnzcash.makeSynchronizer(config)

      realSynchronizer.subscribe({
        onBalanceChanged(event): void {
          emit(out, 'balanceChanged', event)
        },
        onStatusChanged(status): void {
          emit(out, 'statusChanged', status)
        },
        onTransactionsChanged(event): void {
          emit(out, 'transactionsChanged', event)
        },
        onUpdate(event): void {
          emit(out, 'update', event)
        },
        onError(event): void {
          emit(out, 'error', event)
        }
      })

      const out: ZcashSynchronizer = bridgifyObject({
        on: onMethod,
        deriveUnifiedAddress: async () => {
          return await realSynchronizer.deriveUnifiedAddress()
        },
        rescan: async () => {
          return await realSynchronizer.rescan()
        },
        proposeTransfer: async proposeTransferOpts => {
          return await realSynchronizer.proposeTransfer(proposeTransferOpts)
        },
        proposeFulfillingPaymentURI: async paymentUri => {
          return await realSynchronizer.proposeFulfillingPaymentURI(paymentUri)
        },
        createTransfer: async transferOpts => {
          return await realSynchronizer.createTransfer(transferOpts)
        },
        broadcastTransfer: async txid => {
          return await realSynchronizer.broadcastTransfer(txid)
        },
        shieldFunds: async shieldFundsInfo => {
          return await realSynchronizer.shieldFunds(shieldFundsInfo)
        },
        stop: async () => {
          return await realSynchronizer.stop()
        },

        proposeOrchardToIronwoodMigration: async () => {
          return await realSynchronizer.proposeOrchardToIronwoodMigration()
        }
      })

      return out
    }
  })
}

export function makeZcashIo(): ZcashIo {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnzcash = require('react-native-zcash')
  return wrapZcashNative(rnzcash)
}
