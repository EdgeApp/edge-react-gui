// @flow

import { toNewFormat } from '../utils/addressFormat/addressFormatIndex.js'
import type {
  BlockHeight,
  Output,
  Script,
  StandardOutput,
  TxOptions,
  Utxo,
  SpendCoin
} from '../utils/coinUtils.js'
import { createTX, getLock, parsePath, createSpendTX } from '../utils/coinUtils.js'
import {
  type FormatSelector,
  formatSelector,
  getAllKeyRings
} from '../utils/formatSelector.js'
import { logger } from '../utils/logger.js'
import { type AddressInfo } from './engineState.js'
import { type PluginIo } from '../plugin/pluginIo.js'

const GAP_LIMIT = 10
const nop = () => {}

export type Address = {
  displayAddress: string,
  scriptHash: string,
  index: number,
  branch: number,
  redeemScript?: string
}

export type KeyRing = {
  pubKey: any,
  privKey: any,
  children: Array<Address>
}

export type Keys = {
  master: KeyRing,
  receive: KeyRing,
  change: KeyRing
}

export type RawKey = string

export type RawKeyRing = {
  xpriv?: RawKey,
  xpub?: string
}

export type RawKeys = {
  master?: RawKeyRing,
  receive?: RawKeyRing,
  change?: RawKeyRing
}

export type createTxOptions = {
  outputs?: Array<Output>,
  utxos: Array<Utxo>,
  height: BlockHeight,
  rate: number,
  txOptions: TxOptions
}

export type createSpendTxOptions = {
  outputs?: Array<Output>,
  utxos: Array<Utxo>,
  height: BlockHeight,
  rate: number,
  txOptions: TxOptions,
  io: PluginIo,
  privateKey: string,
  mints: SpendCoin[],
  currentIndex: number
}

export type SignMessage = {
  message: string,
  address: string
}

export interface KeyManagerCallbacks {
  // When deriving new address send it to caching and subscribing
  +onNewAddress?: (
    scriptHash: string,
    address: string,
    path: string,
    redeemScript?: string
  ) => mixed;
  // When deriving new key send it to caching
  +onNewKey?: (keys: any) => mixed;
}

// The subset of the EngineState object we actually need:
type BasicEngineState = {
  addressInfos: { [scriptHash: string]: AddressInfo },
  parsedTxs: { [txid: string]: any },
  scriptHashes: { [displayAddress: string]: string }
}

export type KeyManagerOptions = {
  // Derivation:
  account?: number,
  bip?: string,
  coinType?: number,
  gapLimit: number,
  network: string,
  rawKeys?: RawKeys,
  seed?: string,

  // EngineState:
  engineState: BasicEngineState,

  // Callbacks:
  callbacks: KeyManagerCallbacks
}

export class KeyManager {
  // Derivation:
  masterPath: string
  bip: string
  seed: string
  gapLimit: number
  network: string
  fSelector: FormatSelector

  // Our state:
  writeLock: any
  keys: Keys

  // EngineState:
  engineState: BasicEngineState

  // Callbacks:
  onNewAddress: (
    scriptHash: string,
    address: string,
    path: string,
    redeemScript?: string
  ) => mixed
  onNewKey: (keys: any) => mixed

  constructor (opts: KeyManagerOptions) {
    const {
      account = 0,
      bip = 'bip32',
      coinType = -1,
      rawKeys = {},
      seed = '',
      gapLimit = GAP_LIMIT,
      network,
      callbacks
    } = opts

    // Check for any way to init the wallet with either a seed or master keys
    if (
      seed === '' &&
      (!rawKeys.master || (!rawKeys.master.xpriv && !rawKeys.master.xpub))
    ) {
      throw new Error('Missing Master Key')
    }
    this.seed = seed
    this.gapLimit = gapLimit
    this.network = network
    this.bip = bip
    this.fSelector = formatSelector(bip, network)
    // Create a lock for when deriving addresses
    this.writeLock = getLock()
    // Create the master derivation path
    this.masterPath = this.fSelector.createMasterPath(account, coinType)
    this.engineState = opts.engineState
    // Set the callbacks with nops as default
    const { onNewAddress = nop, onNewKey = nop } = callbacks
    this.onNewAddress = onNewAddress
    this.onNewKey = onNewKey

    // Create KeyRings while tring to load as many of the pubKey/privKey from the cache
    this.keys = this.fSelector.keysFromRaw(rawKeys)
    // Load addresses from Cache
    const { branches } = this.fSelector
    const { addressInfos } = this.engineState
    for (const scriptHash in addressInfos) {
      const addressObj: AddressInfo = addressInfos[scriptHash]
      const path = parsePath(addressObj.path, this.masterPath)
      if (path.length) {
        const [branch, index] = path
        const displayAddress = toNewFormat(addressObj.displayAddress, network)
        const { redeemScript } = addressObj
        const address = {
          displayAddress,
          scriptHash,
          index,
          branch,
          redeemScript
        }
        const branchName = branches[`${branch}`]
        this.keys[branchName].children.push(address)
      }
    }
    // Cache is not sorted so sort addresses according to derivation index
    for (const branch in this.keys) {
      this.keys[branch].children.sort((a, b) => a.index - b.index)
    }
  }

  // ////////////////////////////////////////////// //
  // /////////////// Public API /////////////////// //
  // ////////////////////////////////////////////// //
  async load () {
    // If we don't have a public master key we will now create it from seed
    if (!this.keys.master.pubKey) await this.initMasterKeys()
    await this.setLookAhead(true)
  }

  async reload () {
    for (const branch in this.keys) {
      this.keys[branch].children = []
    }
    await this.load()
  }

  getReceiveAddress (): string {
    return this.getNextAvailable(this.keys.receive.children)
  }

  getChangeAddress (): string {
    if (this.bip === 'bip32') return this.getReceiveAddress()
    return this.getNextAvailable(this.keys.change.children)
  }

  async createSpendTX (options: createSpendTxOptions): any {
    logger.info('spend option ', JSON.stringify(options))
    const { outputs = [], ...rest } = options
    const standardOutputs: Array<StandardOutput> = []
    const branches = this.fSelector.branches
    for (const output of outputs) {
      let { address = '' } = output
      if (output.script) {
        const { type, params } = output.script
        const keyRing = this.keys[type]
        if (params && params.length) {
          const index = keyRing.children.length
          const branch = Object.keys(branches).find(
            num => type === branches[num]
          )
          if (!branch) throw new Error(`Branch does not exist`)
          const addressObj = await this.deriveAddress(
            keyRing,
            Number(branch),
            index,
            output.script
          )
          if (!addressObj) {
            throw new Error(`Error creating address from script type ${type}`)
          }
          address = addressObj.displayAddress
        } else {
          address = this.getNextAvailable(keyRing.children)
        }
      }
      if (address) standardOutputs.push({ address, value: output.value })
    }
    return createSpendTX({
      ...rest,
      outputs: standardOutputs,
      changeAddress: this.getChangeAddress(),
      estimate: prev => this.fSelector.estimateSize(prev),
      network: this.network
    })
  }

  async createTX (options: createTxOptions): any {
    const { outputs = [], ...rest } = options
    const standardOutputs: Array<StandardOutput> = []
    const branches = this.fSelector.branches
    for (const output of outputs) {
      let { address = '' } = output
      if (output.script) {
        const { type, params } = output.script
        const keyRing = this.keys[type]
        if (params && params.length) {
          const index = keyRing.children.length
          const branch = Object.keys(branches).find(
            num => type === branches[num]
          )
          if (!branch) throw new Error(`Branch does not exist`)
          const addressObj = await this.deriveAddress(
            keyRing,
            Number(branch),
            index,
            output.script
          )
          if (!addressObj) {
            throw new Error(`Error creating address from script type ${type}`)
          }
          address = addressObj.displayAddress
        } else {
          address = this.getNextAvailable(keyRing.children)
        }
      }
      if (address) standardOutputs.push({ address, value: output.value })
    }
    return createTX({
      ...rest,
      outputs: standardOutputs,
      changeAddress: this.getChangeAddress(),
      estimate: prev => this.fSelector.estimateSize(prev),
      network: this.network
    })
  }

  async sign (tx: any, privateKeys: Array<string> = []) {
    const keyRings = await getAllKeyRings(privateKeys, this.network)
    if (!keyRings.length) {
      if (!this.keys.master.privKey && this.seed === '') {
        throw new Error("Can't sign without private key")
      }
      await this.initMasterKeys()
      const { branches } = this.fSelector
      for (const input of tx.inputs) {
        const { prevout } = input
        if (prevout) {
          const { branch, index, redeemScript } = this.utxoToAddress(prevout)
          const branchName = branches[`${branch}`]
          const keyRing = this.keys[branchName]
          if (!keyRing.privKey) {
            keyRing.privKey = await this.fSelector.deriveHdKey(
              this.keys.master.privKey,
              branch
            )
            this.saveKeysToCache()
          }
          const key = await this.fSelector.deriveKeyRing(
            keyRing.privKey,
            index,
            redeemScript
          )
          keyRings.push(key)
        }
      }
    }
    return this.fSelector.sign(tx, keyRings)
  }

  getSeed (): string | null {
    if (this.seed && this.seed !== '') {
      try {
        return this.fSelector.parseSeed(this.seed)
      } catch (e) {
        logger.error(e)
        return null
      }
    }
    return null
  }

  getPublicSeed (): string | null {
    return this.keys.master.pubKey
      ? this.keys.master.pubKey.toBase58(this.network)
      : null
  }

  // ////////////////////////////////////////////// //
  // ////////////// Private API /////////////////// //
  // ////////////////////////////////////////////// //

  async getKeyForAddress (address: string): Object {
    if (!this.keys.master.privKey && this.seed === '') {
      throw new Error("Can't sign without private key")
    }
    await this.initMasterKeys()
    const { addressInfos, scriptHashes } = this.engineState
    if (!address) throw new Error('Missing address to sign with')
    const scriptHash = scriptHashes[address]
    if (!scriptHash) throw new Error('Address is not part of this wallet')
    const addressInfo = addressInfos[scriptHash]
    if (!addressInfo) throw new Error('Address is not part of this wallet')
    const { path } = addressInfo
    const pathSuffix = path.split(this.masterPath + '/')[1]
    const [branch: string, index: string] = pathSuffix.split('/')
    const branchName = this.fSelector.branches[`${branch}`]
    const keyRing = this.keys[branchName]
    if (!keyRing.privKey) {
      keyRing.privKey = await this.fSelector.deriveHdKey(
        this.keys.master.privKey,
        parseInt(branch)
      )
      this.saveKeysToCache()
    }
    const key = await this.fSelector.deriveKeyRing(
      keyRing.privKey,
      parseInt(index)
    )
    return key
  }

  utxoToAddress (
    prevout: any
  ): { branch: number, index: number, redeemScript?: string } {
    const { parsedTxs, addressInfos } = this.engineState

    const parsedTx = parsedTxs[prevout.rhash()]
    if (!parsedTx) throw new Error('UTXO not synced yet')
    const output = parsedTx.outputs[prevout.index]
    if (!output) throw new Error('Corrupt UTXO or output list')
    const scriptHash = output.scriptHash
    const address = addressInfos[scriptHash]
    if (!address) throw new Error('Address is not part of this wallet')
    const { path, redeemScript } = address
    const pathSuffix = path.split(this.masterPath + '/')[1]
    const [branch, index] = pathSuffix.split('/')
    return { branch: parseInt(branch), index: parseInt(index), redeemScript }
  }

  getNextAvailable (addresses: Array<Address>): string {
    const { addressInfos } = this.engineState
    let key = null
    for (let i = 0; i < addresses.length; i++) {
      const scriptHash = addresses[i].scriptHash
      if (addressInfos[scriptHash] && !addressInfos[scriptHash].used) {
        key = addresses[i]
        break
      }
    }
    return key
      ? key.displayAddress
      : addresses[addresses.length - 1].displayAddress
  }

  async initMasterKeys () {
    const keys = await this.fSelector.getMasterKeys(
      this.seed,
      this.masterPath,
      this.keys.master.privKey
    )
    this.keys.master = { ...this.keys.master, ...keys }
    this.saveKeysToCache()
  }

  saveKeysToCache () {
    try {
      const keys = {}
      for (const type in this.keys) {
        keys[type] = {}
        if (this.keys[type].privKey) {
          keys[type].xpriv = this.keys[type].privKey.toBase58(this.network)
        }
        if (this.keys[type].pubKey) {
          keys[type].xpub = this.keys[type].pubKey.toBase58(this.network)
        }
      }
      this.onNewKey(keys)
    } catch (e) {
      logger.error(e)
    }
  }

  async setLookAhead (closeGaps: boolean = false) {
    const unlock = await this.writeLock.lock()
    try {
      for (const branchNum in this.fSelector.branches) {
        const branchName = this.fSelector.branches[branchNum]
        await this.deriveNewKeys(
          this.keys[branchName],
          parseInt(branchNum),
          closeGaps
        )
      }
    } finally {
      unlock()
    }
  }

  async deriveNewKeys (keyRing: KeyRing, branch: number, closeGaps: boolean) {
    const { children } = keyRing
    // If we never derived a public key for this branch before
    if (!keyRing.pubKey) {
      keyRing.pubKey = await this.fSelector.deriveHdKey(
        this.keys.master.pubKey,
        branch
      )
      this.saveKeysToCache()
    }

    // If the chain might have gaps, fill those in:
    if (closeGaps) {
      let index = 0
      const length = children.length
      for (let i = 0; i < length; ++i, ++index) {
        while (index < children[i].index) {
          const newAddr = await this.deriveAddress(keyRing, branch, index++)
          if (!newAddr) break
        }
      }
      if (children.length > length) {
        // New addresses get appended, so sort them back into position:
        children.sort((a, b) => a.index - b.index)
      }
    }

    // Find the last used address:
    const { addressInfos } = this.engineState
    let lastUsed =
      children.length < this.gapLimit ? 0 : children.length - this.gapLimit
    for (let i = lastUsed; i < children.length; ++i) {
      const scriptHash = children[i].scriptHash
      if (addressInfos[scriptHash] && addressInfos[scriptHash].used) {
        lastUsed = i
      }
    }

    // If the last used address is too close to the end, generate some more:
    while (lastUsed + this.gapLimit > children.length) {
      const newAddr = await this.deriveAddress(keyRing, branch, children.length)
      if (!newAddr) break
    }
  }

  /**
   * Derives an address at the specified branch and index from the keyRing,
   * and adds it to the state.
   * @param keyRing The KeyRing corresponding to the selected branch.
   */
  async deriveAddress (
    keyRing: KeyRing,
    branch: number,
    index: number,
    scriptObj?: Script
  ): Promise<Address | null> {
    let newAddress = {}

    if (!this.fSelector.hasScript(branch, scriptObj)) {
      newAddress = await this.fSelector.deriveAddress(keyRing.pubKey, index)
    } else {
      newAddress = await this.fSelector.deriveScriptAddress(
        keyRing.pubKey,
        index,
        branch,
        scriptObj
      )
    }

    if (!newAddress) return null
    const { address, scriptHash, redeemScript } = newAddress
    const displayAddress = toNewFormat(address, this.network)
    const keyPath = `${this.masterPath}/${branch}/${index}`
    const addressObj = {
      displayAddress,
      scriptHash,
      index,
      branch,
      redeemScript
    }
    keyRing.children.push(addressObj)
    this.onNewAddress(scriptHash, displayAddress, keyPath, redeemScript)
    return addressObj
  }
}
