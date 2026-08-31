import { mkdirSync } from 'fs'

import { loadNativeAddon, NativeDashAddon } from './load-addon'
import {
  Addresses,
  CreateTransferOpts,
  InitializerConfig,
  Network,
  ProposalSuccess,
  ProposeTransferOpts,
  SpendFailure,
  SpendSuccess,
  SynchronizerCallbacks,
  ViewingKeySet
} from './types'

export * from './types'

export interface MakeNodeDashShieldedOpts {
  documentDirectory: string
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return { errorMessage: value }
  }
}

export const Tools = {
  deriveViewingKey: (
    mnemonicSeed: string,
    network: Network
  ): Promise<ViewingKeySet> => {
    const addon = loadNativeAddon()
    return Promise.resolve({
      fullViewingKey: addon.deriveViewingKey(mnemonicSeed, network)
    })
  },
  deriveShieldedAddress: async (
    mnemonicSeed: string,
    network: Network,
    account: number = 0
  ): Promise<string> => {
    const addon = loadNativeAddon()
    const alias = `tools-addr-${network}-${account}`
    await addon.initialize(mnemonicSeed, account, alias, network, '', 0)
    const { shieldedAddress } = await addon.deriveShieldedAddress(alias)
    await addon.stop(alias)
    return shieldedAddress
  },
  isValidAddress: (
    address: string,
    network: Network = 'mainnet'
  ): Promise<boolean> => {
    const addon = loadNativeAddon()
    return Promise.resolve(addon.isValidAddress(address, network))
  },
  warmUpProver: async (): Promise<void> => {
    const addon = loadNativeAddon()
    await addon.warmUpProver()
  },
  isProverReady: (): Promise<boolean> => {
    const addon = loadNativeAddon()
    return Promise.resolve(addon.isProverReady())
  }
}

export class Synchronizer {
  alias: string
  network: Network
  private readonly addon: NativeDashAddon
  private timer?: ReturnType<typeof setTimeout>
  private callbacks?: SynchronizerCallbacks
  private lastStatus?: string

  constructor(alias: string, network: Network, addon: NativeDashAddon) {
    this.alias = alias
    this.network = network
    this.addon = addon
  }

  async stop(): Promise<string> {
    this.unsubscribe()
    return this.addon.stop(this.alias)
  }

  async initialize(config: InitializerConfig): Promise<void> {
    const seed = config.mnemonicSeed ?? config.seedHex
    if (seed == null) throw new Error('Missing mnemonicSeed')
    await this.addon.initialize(
      seed,
      config.account,
      config.alias,
      config.network,
      config.defaultHost,
      config.defaultPort
    )
  }

  async startSync(): Promise<void> {
    await this.addon.startSync(this.alias)
  }

  async stopSync(): Promise<void> {
    await this.addon.stopSync(this.alias)
  }

  async deriveShieldedAddress(): Promise<Addresses> {
    return this.addon.deriveShieldedAddress(this.alias)
  }

  async getBalance(): Promise<{
    availableCredits: string
    totalCredits: string
  }> {
    const snap = await this.addon.poll(this.alias)
    return {
      availableCredits: snap.availableCredits,
      totalCredits: snap.totalCredits
    }
  }

  async getTransactions(): Promise<
    Array<{
      txid: string
      blockTimeInSeconds: number
      minedHeight: number
      value: string
      fee?: string
      toAddress?: string
      memos: string[]
    }>
  > {
    const snap = await this.addon.poll(this.alias)
    return snap.transactions
  }

  async proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess> {
    const raw = await this.addon.proposeTransfer(
      this.alias,
      opts.amountCredits,
      opts.toAddress,
      opts.memo
    )
    return parseJsonObject(raw) as ProposalSuccess
  }

  async createTransfer(
    opts: CreateTransferOpts
  ): Promise<SpendSuccess | SpendFailure> {
    try {
      const raw = await this.addon.createTransfer(
        this.alias,
        opts.proposalId,
        opts.mnemonicSeed
      )
      return parseJsonObject(raw) as SpendSuccess
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return { errorMessage }
    }
  }

  subscribe(callbacks: SynchronizerCallbacks): void {
    this.callbacks = callbacks
    this.pump().catch(error => {
      callbacks.onError({
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
  }

  private async pump(): Promise<void> {
    if (this.callbacks == null) return
    const snap = await this.addon.poll(this.alias)
    const {
      onBalanceChanged,
      onStatusChanged,
      onTransactionsChanged,
      onUpdate
    } = this.callbacks

    onBalanceChanged({
      availableCredits: snap.availableCredits,
      totalCredits: snap.totalCredits
    })

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
  config: InitializerConfig
): Promise<Synchronizer> => {
  const addon = loadNativeAddon()
  const synchronizer = new Synchronizer(config.alias, config.network, addon)
  await synchronizer.initialize(config)
  return synchronizer
}

export function makeNodeDashShieldedModule(
  opts: MakeNodeDashShieldedOpts
): {
  Tools: typeof Tools
  makeSynchronizer: typeof makeSynchronizer
} {
  mkdirSync(opts.documentDirectory, { recursive: true })
  const addon = loadNativeAddon()
  addon.setDocumentDirectory(opts.documentDirectory)
  return { Tools, makeSynchronizer }
}
