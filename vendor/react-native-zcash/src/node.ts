import { mkdirSync } from 'fs'

import { add } from 'biggystring'

import { loadNativeAddon, NativeZcashAddon } from './load-addon'
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

export interface MakeNodeZcashOpts {
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
  deriveViewingKey: async (
    seedBytesHex: string,
    network: Network
  ): Promise<string> => {
    const addon = loadNativeAddon()
    return addon.deriveViewingKey(seedBytesHex, network)
  },
  getBirthdayHeight: async (host: string, port: number): Promise<number> => {
    const addon = loadNativeAddon()
    return await addon.getBirthdayHeight(host, port)
  },
  isValidAddress: async (
    address: string,
    network: Network = 'mainnet'
  ): Promise<boolean> => {
    const addon = loadNativeAddon()
    return addon.isValidAddress(address, network)
  },
  getIronwoodActivationHeight: async (
    network: Network = 'mainnet'
  ): Promise<number | null> => {
    const addon = loadNativeAddon()
    return addon.ironwoodActivationHeight(network)
  }
}

type Callback = (...args: any[]) => any

export class Synchronizer {
  alias: string
  network: Network
  private addon: NativeZcashAddon
  private timer?: ReturnType<typeof setTimeout>
  private callbacks?: SynchronizerCallbacks
  private lastStatus?: string

  constructor(alias: string, network: Network, addon: NativeZcashAddon) {
    this.alias = alias
    this.network = network
    this.addon = addon
  }

  async stop(): Promise<string> {
    this.unsubscribe()
    return await this.addon.stop(this.alias)
  }

  async initialize(initializerConfig: InitializerConfig): Promise<void> {
    await this.addon.initialize(
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
    return await this.addon.deriveUnifiedAddress(this.alias)
  }

  async getLatestNetworkHeight(alias: string): Promise<number> {
    return await this.addon.getLatestNetworkHeight(alias)
  }

  async rescan(): Promise<void> {
    await this.addon.rescan(this.alias)
  }

  async proposeOrchardToIronwoodMigration(): Promise<ImmediateMigrationProposal> {
    const raw = await this.addon.proposeOrchardToIronwoodMigration(this.alias)
    return parseJsonObject(raw) as ImmediateMigrationProposal
  }

  async proposeTransfer(opts: ProposeTransferOpts): Promise<ProposalSuccess> {
    const raw = await this.addon.proposeTransfer(
      this.alias,
      opts.zatoshi,
      opts.toAddress,
      opts.memo
    )
    return parseJsonObject(raw) as ProposalSuccess
  }

  async proposeFulfillingPaymentURI(
    paymentUri: string
  ): Promise<ProposalSuccess> {
    const raw = await this.addon.proposeFulfillingPaymentUri(
      this.alias,
      paymentUri
    )
    return parseJsonObject(raw) as ProposalSuccess
  }

  async createTransfer(
    opts: CreateTransferOpts
  ): Promise<SpendSuccess | SpendFailure> {
    try {
      const raw = await this.addon.createTransfer(
        this.alias,
        opts.proposalBase64,
        opts.mnemonicSeed
      )
      return parseJsonObject(raw) as SpendSuccess
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return { errorMessage }
    }
  }

  async broadcastTransfer(txid: string): Promise<string> {
    return await this.addon.broadcastTransfer(this.alias, txid)
  }

  async shieldFunds(shieldFundsInfo: ShieldFundsInfo): Promise<string> {
    return await this.addon.shieldFunds(
      this.alias,
      shieldFundsInfo.seed,
      shieldFundsInfo.memo,
      shieldFundsInfo.threshold
    )
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
  const addon = loadNativeAddon()
  const synchronizer = new Synchronizer(
    initializerConfig.alias,
    initializerConfig.networkName,
    addon
  )
  await synchronizer.initialize(initializerConfig)
  return synchronizer
}

export function makeNodeZcashModule(opts: MakeNodeZcashOpts): {
  Tools: typeof Tools
  makeSynchronizer: typeof makeSynchronizer
} {
  mkdirSync(opts.documentDirectory, { recursive: true })
  const addon = loadNativeAddon()
  addon.setDocumentDirectory(opts.documentDirectory)
  return { Tools, makeSynchronizer }
}
