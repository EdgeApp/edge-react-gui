import { add } from 'biggystring'
import {
  EventSubscription,
  NativeEventEmitter,
  NativeModules
} from 'react-native'

import {
  Addresses,
  CreateTransferOpts,
  ImmediateMigrationProposal,
  InitializerConfig,
  Network,
  ProposalSuccess,
  ProposeTransferOpts,
  ShieldFundsInfo,
  SpendFailure,
  SpendSuccess,
  SynchronizerCallbacks
} from './types'
export * from './types'

const { RNZcash } = NativeModules

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return { errorMessage: value }
  }
}

export const Tools = {
  deriveViewingKey: async (
    seedBytesHex: string,
    network: Network
  ): Promise<string> => {
    const result = await RNZcash.deriveViewingKey(seedBytesHex, network)
    return result
  },
  getBirthdayHeight: async (host: string, port: number): Promise<number> => {
    const result = await RNZcash.getBirthdayHeight(host, port)
    return result
  },
  isValidAddress: async (
    address: string,
    network: Network = 'mainnet'
  ): Promise<boolean> => {
    const result = await RNZcash.isValidAddress(address, network)
    return result
  },
  getIronwoodActivationHeight: async (
    network: Network = 'mainnet'
  ): Promise<number | null> => {
    const result = await RNZcash.ironwoodActivationHeight(network)
    return result
  }
}

export class Synchronizer {
  eventEmitter: NativeEventEmitter
  subscriptions: EventSubscription[]
  alias: string
  network: Network
  private timer?: ReturnType<typeof setTimeout>
  private callbacks?: SynchronizerCallbacks
  private lastStatus?: string

  constructor(alias: string, network: Network) {
    this.eventEmitter = new NativeEventEmitter(RNZcash)
    this.subscriptions = []
    this.alias = alias
    this.network = network
  }

  async stop(): Promise<string> {
    this.unsubscribe()
    const result = await RNZcash.stop(this.alias)
    return result
  }

  async initialize(initializerConfig: InitializerConfig): Promise<void> {
    await RNZcash.initialize(
      initializerConfig.mnemonicSeed,
      initializerConfig.birthdayHeight,
      initializerConfig.alias,
      initializerConfig.networkName,
      initializerConfig.defaultHost,
      initializerConfig.defaultPort,
      initializerConfig.newWallet
    )
  }

  async deriveUnifiedAddress(): Promise<Addresses> {
    const result = await RNZcash.deriveUnifiedAddress(this.alias)
    return result
  }

  async getLatestNetworkHeight(alias: string): Promise<number> {
    const result = await RNZcash.getLatestNetworkHeight(alias)
    return result
  }

  async rescan(): Promise<void> {
    await RNZcash.rescan(this.alias)
  }

  async proposeOrchardToIronwoodMigration(): Promise<
    ImmediateMigrationProposal
  > {
    const result = await RNZcash.proposeOrchardToIronwoodMigration(this.alias)
    return parseJsonObject(result) as ImmediateMigrationProposal
  }

  async proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess> {
    const result = await RNZcash.proposeTransfer(
      this.alias,
      opts.zatoshi,
      opts.toAddress,
      opts.memo
    )
    return parseJsonObject(result) as ProposalSuccess
  }

  async proposeFulfillingPaymentURI(
    paymentUri: string
  ): Promise<ProposalSuccess> {
    const result = await RNZcash.proposeFulfillingPaymentURI(
      this.alias,
      paymentUri
    )
    return parseJsonObject(result) as ProposalSuccess
  }

  async createTransfer(
    opts: CreateTransferOpts
  ): Promise<SpendSuccess | SpendFailure> {
    try {
      const result = await RNZcash.createTransfer(
        this.alias,
        opts.proposalBase64,
        opts.mnemonicSeed
      )
      return parseJsonObject(result) as SpendSuccess
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return { errorMessage }
    }
  }

  async broadcastTransfer(txid: string): Promise<string> {
    return await RNZcash.broadcastTransfer(this.alias, txid)
  }

  async shieldFunds(shieldFundsInfo: ShieldFundsInfo): Promise<string> {
    const result = await RNZcash.shieldFunds(
      this.alias,
      shieldFundsInfo.seed,
      shieldFundsInfo.memo,
      shieldFundsInfo.threshold
    )
    return result
  }

  subscribe({
    onBalanceChanged,
    onStatusChanged,
    onTransactionsChanged,
    onUpdate,
    onError
  }: SynchronizerCallbacks): void {
    this.callbacks = {
      onBalanceChanged,
      onStatusChanged,
      onTransactionsChanged,
      onUpdate,
      onError
    }
    this.pump().catch(error => {
      onError({
        alias: this.alias,
        level: 'error',
        message: `event pump failed: ${String(error)}`
      })
    })
  }

  unsubscribe(): void {
    if (this.timer != null) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.callbacks = undefined
    this.subscriptions.forEach(subscription => {
      subscription.remove()
    })
    this.subscriptions = []
  }

  private async pump(): Promise<void> {
    if (this.callbacks == null) return
    const snap = await RNZcash.poll(this.alias)
    const {
      onBalanceChanged,
      onStatusChanged,
      onTransactionsChanged,
      onUpdate
    } = this.callbacks

    const event = {
      ...snap.balances,
      availableZatoshi: add(
        add(
          add(
            snap.balances.transparentAvailableZatoshi,
            snap.balances.saplingAvailableZatoshi
          ),
          snap.balances.orchardAvailableZatoshi
        ),
        snap.balances.ironwoodAvailableZatoshi
      ),
      totalZatoshi: add(
        add(
          add(
            snap.balances.transparentTotalZatoshi,
            snap.balances.saplingTotalZatoshi
          ),
          snap.balances.orchardTotalZatoshi
        ),
        snap.balances.ironwoodTotalZatoshi
      )
    }
    onBalanceChanged(event)

    if (snap.status !== this.lastStatus) {
      this.lastStatus = snap.status
      onStatusChanged({
        alias: this.alias,
        name: snap.status as 'STOPPED' | 'DISCONNECTED' | 'SYNCING' | 'SYNCED'
      })
    }

    onTransactionsChanged({ transactions: snap.transactions })
    onUpdate({
      alias: this.alias,
      scanProgress: snap.scanProgress,
      networkBlockHeight: snap.networkBlockHeight
    })

    const delay = snap.status === 'SYNCING' ? 500 : 2000
    this.timer = setTimeout(() => {
      this.pump().catch(error => {
        this.callbacks?.onError({
          alias: this.alias,
          level: 'error',
          message: `event pump failed: ${String(error)}`
        })
      })
    }, delay)
  }
}

export const makeSynchronizer = async (
  initializerConfig: InitializerConfig
): Promise<Synchronizer> => {
  const synchronizer = new Synchronizer(
    initializerConfig.alias,
    initializerConfig.networkName
  )
  await synchronizer.initialize(initializerConfig)
  return synchronizer
}
