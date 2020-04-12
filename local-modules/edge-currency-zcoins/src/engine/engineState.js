// @flow

import { type Disklet } from 'disklet'
import EventEmitter from 'eventemitter3'
import stable from 'stable'
import { parse } from 'uri-js'

import { type PluginIo } from '../plugin/pluginIo.js'
import { type PluginState } from '../plugin/pluginState.js'
// import { scoreServer2 } from '../plugin/pluginState.js'
import type {
  StratumCallbacks,
  StratumTask
} from '../stratum/stratumConnection.js'
import { StratumConnection } from '../stratum/stratumConnection.js'
import {
  broadcastTx,
  fetchBlockHeader,
  fetchScriptHashHistory,
  fetchScriptHashUtxo,
  fetchTransaction,
  subscribeHeight,
  subscribeScriptHash,
  getMintMetadata,
  getAnonymitySet,
  getUsedCoinSerials,
  getLatestCoinIds,
} from '../stratum/stratumMessages.js'
import type {
  StratumBlockHeader,
  StratumHistoryRow,
  StratumUtxo
} from '../stratum/stratumMessages.js'
import {
  bitcoinTimestampFromHeader,
  parseTransaction
} from '../utils/coinUtils.js'
import { logger } from '../utils/logger.js'
import { pushUpdate, removeIdFromQueue } from '../utils/updateQueue.js'
import { type EngineCurrencyInfo } from './currencyEngine.js'
import { SIGMA_ENCRYPTED_FILE } from '../utils/sigma/sigmaTypes'

export type UtxoInfo = {
  txid: string, // tx_hash from Stratum
  index: number, // tx_pos from Stratum
  value: number // Satoshis fit in a number
}

export type AddressInfo = {
  txids: Array<string>,
  utxos: Array<UtxoInfo>,
  used: boolean, // Set manually by `addGapLimitAddress`
  displayAddress: string, // base58 or other wallet-ready format
  path: string, // TODO: Define the contents of this member.
  balance: number,
  redeemScript?: string
}

export type AddressInfos = {
  [scriptHash: string]: AddressInfo
}

export type AddressState = {
  subscribed: boolean,
  synced: boolean,

  hash: string | null,
  // Timestamp of the last hash change.
  // The server with the latest timestamp "owns" an address for the sake
  // of fetching utxos and txids:
  lastUpdate: number,

  fetchingUtxos: boolean,
  fetchingTxids: boolean,
  subscribing: boolean
}

export type AnonymitySet = {
  blockHash: string,
  serializedCoins: string[]
}

export type UsedSerials = {
  serials: string[]
}

export type CoinGroup = {
  denom: number,
  coinGroupId: number
}

export type MintMetadata = {
  pubcoin: string,
  groupId: number
}

export interface EngineStateCallbacks {
  // Changes to an address UTXO set:
  +onBalanceChanged?: () => void;

  // Changes to an address 'use' state:
  +onAddressUsed?: () => void;

  // Changes to the chain height:
  +onHeightUpdated?: (height: number) => void;

  // Fetched a transaction from the network:
  +onTxFetched?: (txid: string) => void;

  // Called when the engine gets more synced with electrum:
  +onAddressesChecked?: (progressRatio: number) => void;
}

export interface EngineStateOptions {
  files: { txs: string, addresses: string };
  callbacks: EngineStateCallbacks;
  io: PluginIo;
  localDisklet: Disklet;
  encryptedLocalDisklet: Disklet;
  pluginState: PluginState;
  walletId?: string;
  engineInfo: EngineCurrencyInfo;
}

function nop () {}

const MAX_CONNECTIONS = 2
const NEW_CONNECTIONS = 8
const CACHE_THROTTLE = 0.25

/**
 * This object holds the current state of the wallet engine.
 * It is responsible for staying connected to Stratum servers and keeping
 * this information up to date.
 */
export class EngineState extends EventEmitter {
  // On-disk address information:
  addressCache: {
    [scriptHash: string]: {
      txids: Array<string>,
      txidStratumHash: string,

      utxos: Array<UtxoInfo>,
      utxoStratumHash: string,

      displayAddress: string, // base58 or other wallet-ready format
      path: string, // TODO: Define the contents of this member.

      redeemScript?: string // Allows for saving generic P2SH addresses
    }
  }

  // Derived address information:
  addressInfos: AddressInfos

  // Maps from display addresses to script hashes:
  scriptHashes: { [displayAddress: string]: string }

  // Address usage information sent by the GUI:
  usedAddresses: { [scriptHash: string]: true }

  // On-disk hex transaction data:
  txCache: { [txid: string]: string }

  // Transaction height / Timestamp:
  txHeightCache: {
    [txid: string]: {
      height: number,
      firstSeen: number // Timestamp for unconfirmed stuff
    }
  }

  // Cache of parsed transaction data:
  parsedTxs: { [txid: string]: any }

  // True if `startEngine` has been called:
  engineStarted: boolean

  // Active Stratum connection objects:
  connections: { [uri: string]: StratumConnection }

  // Status of active Stratum connections:
  serverStates: {
    [uri: string]: {
      fetchingHeight: boolean,

      // The server block height:
      // undefined - never subscribed
      // 0 - subscribed but no results yet
      // number - subscription result
      height: number | void,

      // Address subscriptions:
      addresses: { [scriptHash: string]: AddressState },

      // All txids this server knows about (from subscribes or whatever):
      // Servers that know about txids are eligible to fetch those txs.
      // If no server knows about a txid, anybody can try fetching it,
      // but there is no penalty for failing:
      txids: { [txid: string]: true },

      // All block headers this server knows about (from subscribes or whatever):
      // Servers that know about headers are eligible to fetch those headers.
      // If no server knows about a height, anybody can try fetching it,
      // but there is no penalty for failing:
      headers: { [height: string]: true }
    }
  }

  // True if somebody is currently fetching a transaction:
  fetchingTxs: { [txid: string]: boolean }

  // Transactions that are relevant to our addresses, but missing locally:
  missingTxs: { [txid: string]: true }

  // Transactions that are relevant to our addresses, but missing locally and must retrieved with details:
  missingTxsVerbose: { [txid: string]: true }

  // True if somebody is currently fetching a transaction:
  fetchingHeaders: { [height: string]: boolean }

  // Headers that are relevant to our transactions, but missing locally:
  missingHeaders: { [height: string]: true }

  addAddress (
    scriptHash: string,
    displayAddress: string,
    path: string,
    redeemScript?: string
  ) {
    if (this.addressCache[scriptHash]) return

    this.addressCache[scriptHash] = {
      txids: [],
      txidStratumHash: '',
      utxos: [],
      utxoStratumHash: '',
      displayAddress,
      path,
      redeemScript
    }
    this.scriptHashes[displayAddress] = scriptHash
    this.refreshAddressInfo(scriptHash)

    this.dirtyAddressCache()
    for (const uri of Object.keys(this.serverStates)) {
      this.serverStates[uri].addresses[scriptHash] = {
        fetchingTxids: false,
        fetchingUtxos: false,
        hash: null,
        lastUpdate: 0,
        subscribed: false,
        subscribing: false,
        synced: false
      }
    }
  }

  markAddressesUsed (scriptHashes: Array<string>) {
    for (const scriptHash of scriptHashes) {
      this.usedAddresses[scriptHash] = true
      this.refreshAddressInfo(scriptHash)
    }
  }

  async saveKeys (keys: any) {
    try {
      const json = JSON.stringify({ keys: keys })
      await this.encryptedLocalDisklet.setText('keys.json', json)
      logger.info(`${this.walletId}: Saved keys cache`)
    } catch (e) {
      logger.info(`${this.walletId}: ${e.toString()}`)
    }
  }

  async loadKeys () {
    try {
      const keysCacheText = await this.encryptedLocalDisklet.getText(
        'keys.json'
      )
      const keysCacheJson = JSON.parse(keysCacheText)
      // TODO: Validate JSON
      return keysCacheJson.keys
    } catch (e) {
      logger.info(`${this.walletId}: Failed to load key cache: ${e}`)
      return {}
    }
  }

  broadcastTx (rawTx: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uris = Object.keys(this.connections).filter(
        uri => this.connections[uri].connected
      )
      // If we have no connections then error
      if (!uris || !uris.length) {
        reject(
          new Error('No available connections\nCheck your internet signal')
        )
      }
      let resolved = false
      let bad = 0

      const task = broadcastTx(
        rawTx,
        (txid: string) => {
          logger.info(`${this.walletId}: broadcastTx success: ${txid}`)
          // We resolve if any server succeeds:
          if (!resolved) {
            resolved = true
            resolve(txid)
          }
        },
        (e?: Error) => {
          // We fail if every server failed:
          if (++bad === uris.length) {
            const msg = e ? `With error ${e.toString()}` : ''
            logger.info(`${this.walletId} broadcastTx fail: ${rawTx}\n${msg}}`)
            reject(e)
          }
        }
      )

      for (const uri of uris) {
        const connection = this.connections[uri]
        connection.submitTask(task)
      }
    })
  }

  /**
   * Called to complete a spend
   */
  saveTx (txid: string, rawTx: string) {
    this.handleTxidFetch(txid, -1)
    this.handleTxFetch(txid, rawTx)

    // Update the affected addresses:
    for (const scriptHash of this.findAffectedAddresses(txid)) {
      this.addressCache[scriptHash].txids.push(txid)
      this.refreshAddressInfo(scriptHash)
    }
    this.dirtyAddressCache()
  }

  connect () {
    this.progressRatio = 0
    this.txCacheInitSize = Object.keys(this.txCache).length
    this.engineStarted = true
    this.pluginState.addEngine(this)
    this.refillServers()
  }

  async disconnect () {
    removeIdFromQueue(this.walletId)
    this.pluginState.removeEngine(this)
    this.engineStarted = false
    this.progressRatio = 0
    clearTimeout(this.reconnectTimer)
    const closed = []
    for (const uri of Object.keys(this.connections)) {
      closed.push(
        new Promise((resolve, reject) => {
          this.on('connectionClose', uriClosed => {
            if (uriClosed === uri) resolve()
          })
        })
      )
      this.connections[uri].disconnect()
    }
    await Promise.all(closed)
  }

  getBalance (options: any): string {
    let total = Object.keys(this.addressInfos)
      .reduce((total, scriptHash) => {
        const { balance } = this.addressInfos[scriptHash]
        return total + balance
      }, 0)

    // get minted amount
    try {
      this.encryptedLocalDisklet.getText(SIGMA_ENCRYPTED_FILE)
        .then(mintDataStr => {
          logger.info('read local mint data: ', mintDataStr)
          if (mintDataStr) {
            const mintData = JSON.parse(mintDataStr)
            let totalMinted: number = 0
            mintData.forEach((item) => {
              if (item.groupId !== -1 && !item.isSpend) {
                totalMinted += item.value
              }
            })
            if (totalMinted !== this.mintedAmount) {
              this.mintedAmount = totalMinted
              this.onBalanceChanged()
            }
          }
        })
    } catch (e) {
      // no minted coins
    }
    if (typeof options !== 'undefined' && typeof this.mintedAmount !== 'undefined') {
      if (options.mintedBalance) {
        total = this.mintedAmount
      } else if (options.totalBalance) {
        total += this.mintedAmount
      }
    }
    return total.toString()
  }

  getUTXOs () {
    const utxos: any = []
    for (const scriptHash in this.addressInfos) {
      const utxoLength = this.addressInfos[scriptHash].utxos.length
      for (let i = 0; i < utxoLength; i++) {
        const utxo = this.addressInfos[scriptHash].utxos[i]
        const { txid, index } = utxo
        let height = -1
        if (this.txHeightCache[txid]) {
          height = this.txHeightCache[txid].height
        }
        const tx = this.parsedTxs[txid]
        if (tx == null) continue
        utxos.push({ index, tx, height })
      }
    }
    return utxos
  }

  getNumTransactions (options: any): number {
    return Object.keys(this.txCache).length
  }

  dumpData (): any {
    return {
      'engineState.addressCache': this.addressCache,
      'engineState.addressInfos': this.addressInfos,
      'engineState.scriptHashes': this.scriptHashes,
      'engineState.usedAddresses': this.usedAddresses,
      'engineState.txCache': this.txCache,
      'engineState.txHeightCache': this.txHeightCache,
      'engineState.missingHeaders': this.missingHeaders,
      'engineState.serverStates': this.serverStates,
      'engineState.fetchingTxs': this.fetchingTxs,
      'engineState.missingTxs': this.missingTxs,
      'engineState.missingTxsVerbose': this.missingTxsVerbose,
      'engineState.fetchingHeader': this.fetchingHeaders
    }
  }

  // ------------------------------------------------------------------------
  // Private stuff
  // ------------------------------------------------------------------------
  io: PluginIo
  walletId: string
  txFile: string
  addressFile: string
  localDisklet: Disklet
  encryptedLocalDisklet: Disklet
  mintedAmount: number
  pluginState: PluginState
  engineInfo: EngineCurrencyInfo
  onBalanceChanged: () => void
  onAddressUsed: () => void
  onHeightUpdated: (height: number) => void
  onTxFetched: (txid: string) => void
  onAddressesChecked: (progressRatio: number) => void

  addressCacheDirty: boolean
  txCacheDirty: boolean
  reconnectTimer: TimeoutID
  reconnectCounter: number
  progressRatio: number
  txCacheInitSize: number
  serverList: Array<string>

  // sigma related properties
  mintsToRetrieve: { denom: number, pubcoin: string }[]
  retrievedMints: ?MintMetadata[]
  anonymitySetToRetrieve: ?{ denom: number, groupId: number }
  retrievedAnonymitySet: ?AnonymitySet
  retrievedUsedSerials: ?boolean
  usedSerials: ?UsedSerials
  coinGroup: ?CoinGroup[]
  retrievedCoinGroup: ?boolean

  constructor (options: EngineStateOptions) {
    super()
    this.addressCache = {}
    this.addressInfos = {}
    this.scriptHashes = {}
    this.usedAddresses = {}
    this.txCache = {}
    this.parsedTxs = {}
    this.txHeightCache = {}
    this.connections = {}
    this.serverStates = {}
    this.fetchingTxs = {}
    this.missingTxs = {}
    this.missingTxsVerbose = {}
    this.fetchingHeaders = {}
    this.missingHeaders = {}
    this.walletId = options.walletId || ''
    this.io = options.io
    this.txFile = options.files.txs
    this.addressFile = options.files.addresses
    this.localDisklet = options.localDisklet
    this.encryptedLocalDisklet = options.encryptedLocalDisklet
    this.pluginState = options.pluginState
    this.serverList = []
    this.engineInfo = options.engineInfo
    const {
      onBalanceChanged = nop,
      onAddressUsed = nop,
      onHeightUpdated = nop,
      onTxFetched = nop,
      onAddressesChecked = nop
    } = options.callbacks
    this.onBalanceChanged = onBalanceChanged
    this.onAddressUsed = onAddressUsed
    this.onHeightUpdated = onHeightUpdated
    this.onTxFetched = onTxFetched
    this.onAddressesChecked = onAddressesChecked

    this.addressCacheDirty = false
    this.txCacheDirty = false
    this.reconnectCounter = 0
    this.progressRatio = 0
    this.txCacheInitSize = 0
  }

  reconnect () {
    if (this.engineStarted) {
      if (!this.reconnectTimer) {
        if (this.reconnectCounter < 5) this.reconnectCounter++
        this.reconnectTimer = setTimeout(() => {
          clearTimeout(this.reconnectTimer)
          delete this.reconnectTimer
          this.refillServers()
        }, this.reconnectCounter * 1000)
      } else {
      }
    }
  }

  updateProgressRatio () {
    if (this.progressRatio !== 1) {
      const fetchedTxsLen = Object.keys(this.txCache).length
      const missingTxsLen = Object.keys(this.missingTxs).length
      const totalTxs = fetchedTxsLen + missingTxsLen - this.txCacheInitSize

      const scriptHashes = Object.keys(this.addressCache)
      const totalAddresses = scriptHashes.length
      const syncedAddressesLen = scriptHashes.filter(scriptHash => {
        for (const uri in this.serverStates) {
          const address = this.serverStates[uri].addresses[scriptHash]
          if (address && address.synced) return true
        }
        return false
      }).length
      const missingAddressesLen = totalAddresses - syncedAddressesLen
      const allTasks = totalAddresses + totalTxs
      const missingTasks = missingTxsLen + missingAddressesLen
      const percent = (allTasks - missingTasks) / allTasks

      const end = () => {
        this.progressRatio = percent
        this.onAddressesChecked(this.progressRatio)
      }

      if (percent !== this.progressRatio) {
        if (
          Math.abs(percent - this.progressRatio) > CACHE_THROTTLE ||
          percent === 1
        ) {
          const saves = [this.saveAddressCache(), this.saveTxCache()]
          if (this.pluginState) {
            saves.push(this.pluginState.saveHeaderCache())
            saves.push(this.pluginState.saveServerCache())
          }
          Promise.all(saves).then(end)
        }
      }
    }
  }

  refillServers () {
    pushUpdate({
      id: this.walletId,
      updateFunc: () => {
        this.doRefillServers()
      }
    })
  }

  doRefillServers () {
    const { io } = this
    const includePatterns = []
    // if (!this.io.TLSSocket)
    includePatterns.push('electrumws:')
    includePatterns.push('electrum:')
    includePatterns.push('electrumwss:')
    if (this.serverList.length === 0) {
      const serverListTemp = this.pluginState.getServers(
        NEW_CONNECTIONS,
        includePatterns
      )
      // sort list to prioritize tcp servers
      const serverListWss = []
      const serverListTcp = []
      for (const server of serverListTemp) {
        if (server.startsWith('electrumwss')) {
          serverListWss.push(server)
        } else {
          serverListTcp.push(server)
        }
      }
      this.serverList = serverListTcp.concat(serverListWss)
    }
    logger.info(
      `${this.walletId} : refillServers: Top ${NEW_CONNECTIONS} servers:`,
      this.serverList
    )
    let chanceToBePicked = 1.25
    while (Object.keys(this.connections).length < MAX_CONNECTIONS) {
      if (!this.serverList.length) break
      const uri = this.serverList.shift()
      if (this.connections[uri]) {
        continue
      }
      // Validate the URI of server to make sure it is valid
      const parsed = parse(uri)
      if (
        !parsed.scheme ||
        parsed.scheme.length < 3 ||
        !parsed.host ||
        !parsed.port
      ) {
        continue
      }
      chanceToBePicked -= chanceToBePicked > 0.5 ? 0.25 : 0
      if (Math.random() > chanceToBePicked) {
        this.serverList.push(uri)
        continue
      }
      if (!uri) {
        this.reconnect()
        break
      }
      const prefix = `${this.walletId} ${uri.replace('electrum://', '')}:`
      const callbacks: StratumCallbacks = {
        onOpen: () => {
          this.reconnectCounter = 0
          logger.info(`${prefix} ** Connected **`)
        },
        onClose: (error?: Error) => {
          delete this.connections[uri]
          const msg = error ? ` !! Connection ERROR !! ${error.message}` : ''
          logger.info(`${prefix} onClose ${msg}`)
          this.emit('connectionClose', uri)
          if (error != null) {
            if (/Bad Stratum version/.test(error.message)) {
              this.pluginState.serverScoreDown(uri, 100)
            } else this.pluginState.serverScoreDown(uri)
          }
          this.reconnect()
          this.saveAddressCache()
          this.saveTxCache()
        },

        onQueueSpace: (stratumVersion: string) => {
          const task = this.pickNextTask(uri, stratumVersion)
          if (task) {
            const taskMessage = task
              ? `${task.method} params: ${task.params.toString()}`
              : 'no task'
            logger.info(`${prefix} nextTask: ${taskMessage}`)
          }
          return task
        },
        onTimer: (queryTime: number) => {
          logger.info(`${prefix} returned version in ${queryTime}ms`)
          this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
        },
        onVersion: (version: string, requestMs) => {
          logger.info(`${prefix}received version ${version}`)
          this.pluginState.serverScoreUp(uri, requestMs)
        },
        onNotifyHeight: (height: number) => {
          logger.info(`${prefix} returned height: ${height}`)
          this.serverStates[uri].height = height
          this.pluginState.updateHeight(height)
        },

        onNotifyScriptHash: (scriptHash: string, hash: string) => {
          logger.info(`${prefix} notified scripthash change: ${scriptHash}`)
          const addressState = this.serverStates[uri].addresses[scriptHash]
          addressState.hash = hash
          addressState.lastUpdate = Date.now()
        }
      }

      this.connections[uri] = new StratumConnection(uri, {
        callbacks,
        io,
        walletId: this.walletId
      })
      this.serverStates[uri] = {
        fetchingHeight: false,
        height: void 0,
        addresses: {},
        txids: new Set(),
        headers: new Set()
      }
      this.populateServerAddresses(uri)
      this.connections[uri].open()
    }
  }

  pickNextTask (uri: string, stratumVersion: string): StratumTask | void {
    const serverState = this.serverStates[uri]
    const prefix = `${this.walletId} ${uri.replace('electrum://', '')}:`

    // Subscribe to height if this has never happened:
    if (serverState.height === void 0 && !serverState.fetchingHeight) {
      serverState.fetchingHeight = true
      const queryTime = Date.now()
      return subscribeHeight(
        (height: number) => {
          logger.info(`${prefix} received height ${height}`)
          serverState.fetchingHeight = false
          serverState.height = height
          this.pluginState.updateHeight(height)
          this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
        },
        (e: Error) => {
          serverState.fetchingHeight = false
          this.handleMessageError(uri, 'subscribing to height', e)
        }
      )
    }

    // Fetch Headers:
    for (const height of Object.keys(this.missingHeaders)) {
      if (
        !this.fetchingHeaders[height] &&
        this.serverCanGetHeader(uri, height)
      ) {
        this.fetchingHeaders[height] = true
        const queryTime = Date.now()
        return fetchBlockHeader(
          parseInt(height),
          this.engineInfo.timestampFromHeader || bitcoinTimestampFromHeader,
          (header: StratumBlockHeader) => {
            const prettyDate = new Date(header.timestamp * 1000).toISOString()
            logger.info(
              `${prefix} received header for block number ${height} @ ${prettyDate}`
            )
            this.fetchingHeaders[height] = false
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
            this.handleHeaderFetch(height, header)
          },
          (e: Error) => {
            this.fetchingHeaders[height] = false
            if (!serverState.headers[height]) {
              this.handleMessageError(
                uri,
                `getting header for block number ${height}`,
                e
              )
            } else {
              // TODO: Don't penalize the server score either.
            }
          },
          stratumVersion
        )
      }
    }

    // Fetch txids:
    for (const txid of Object.keys(this.missingTxs)) {
      if (!this.fetchingTxs[txid] && this.serverCanGetTx(uri, txid)) {
        this.fetchingTxs[txid] = true
        const queryTime = Date.now()
        return fetchTransaction(
          txid,
          (txData: string) => {
            logger.info(`${prefix} ** RECEIVED TX ** ${txid}`)
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
            this.fetchingTxs[txid] = false
            this.handleTxFetch(txid, txData)
            this.updateProgressRatio()
          },
          (e: Error) => {
            this.fetchingTxs[txid] = false
            if (!serverState.txids[txid]) {
              this.handleMessageError(uri, `getting transaction ${txid}`, e)
            } else {
              // TODO: Don't penalize the server score either.
            }
          }
        )
      }
    }
    for (const txid of Object.keys(this.missingTxsVerbose)) {
      if (this.serverCanGetTx(uri, txid)) {
        delete this.missingTxsVerbose[txid]
        const queryTime = Date.now()
        return fetchTransaction(
          txid,
          (txData) => {
            logger.info(`${prefix} ** RECEIVED VERBOSE TX ** ${txid}`)
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
            this.handleTxFetch(txid, txData.hex)
            this.handleTxidFetch(txid, txData.height)
          },
          (e: Error) => {
            if (!serverState.txids[txid]) {
              this.handleMessageError(uri, `getting verbose transaction ${txid}`, e)
            } else {
              // TODO: Don't penalize the server score either.
            }
          },
          true
        )
      }
    }

    // Fetch utxos:
    for (const address of Object.keys(serverState.addresses)) {
      const addressState = serverState.addresses[address]
      if (
        addressState.hash &&
        addressState.hash !== this.addressCache[address].utxoStratumHash &&
        !addressState.fetchingUtxos &&
        this.findBestServer(address) === uri
      ) {
        addressState.fetchingUtxos = true
        const queryTime = Date.now()
        return fetchScriptHashUtxo(
          address,
          (utxos: Array<StratumUtxo>) => {
            logger.info(`${prefix} received utxos for: ${address}`)
            addressState.fetchingUtxos = false
            if (!addressState.hash) {
              throw new Error(
                'Blank stratum hash (logic bug - should never happen)'
              )
            }
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
            this.handleUtxoFetch(address, addressState.hash || '', utxos)
          },
          (e: Error) => {
            addressState.fetchingUtxos = false
            this.handleMessageError(uri, `fetching utxos for: ${address}`, e)
          }
        )
      }
    }

    const priorityAddressList = stable(
      Object.keys(this.addressInfos),
      (address1: string, address2: string) => {
        return (
          (this.addressInfos[address1].used ? 1 : 0) >
          (this.addressInfos[address2].used ? 1 : 0)
        )
      }
    )
    // Subscribe to addresses:
    for (const address of priorityAddressList) {
      const addressState = serverState.addresses[address]
      if (!addressState.subscribed && !addressState.subscribing) {
        addressState.subscribing = true
        const queryTime = Date.now()
        return subscribeScriptHash(
          address,
          (hash: string | null) => {
            logger.info(
              `${prefix} subscribed to ${address} at ${hash ? hash.slice(0, 6) : 'null'}`
            )
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime, 0)
            addressState.subscribing = false
            addressState.subscribed = true
            addressState.hash = hash
            addressState.lastUpdate = Date.now()
            const { txidStratumHash } = this.addressCache[address]
            if (!hash || hash === txidStratumHash) {
              addressState.synced = true
              this.updateProgressRatio()
            }
          },
          (e: Error) => {
            addressState.subscribing = false
            this.handleMessageError(uri, `subscribing to ${address}`, e)
          }
        )
      }
    }

    // Fetch history:
    for (const address of Object.keys(serverState.addresses)) {
      const addressState = serverState.addresses[address]
      if (
        addressState.hash &&
        addressState.hash !== this.addressCache[address].txidStratumHash &&
        !addressState.fetchingTxids &&
        this.findBestServer(address) === uri
      ) {
        addressState.fetchingTxids = true
        const queryTime = Date.now()
        return fetchScriptHashHistory(
          address,
          (history: Array<StratumHistoryRow>) => {
            logger.info(`${prefix} received history for ${address}`)
            addressState.fetchingTxids = false
            if (!addressState.hash) {
              throw new Error(
                'Blank stratum hash (logic bug - should never happen)'
              )
            }
            this.pluginState.serverScoreUp(uri, Date.now() - queryTime)
            this.handleHistoryFetch(address, addressState, history)
          },
          (e: Error) => {
            addressState.fetchingTxids = false
            this.handleMessageError(
              uri,
              `getting history for address ${address}`,
              e
            )
          }
        )
      }
    }

    if (this.mintsToRetrieve) {
      const mints = this.mintsToRetrieve
      this.mintsToRetrieve = null
      return getMintMetadata(mints.map(info => { return { denom: info.denom, pubcoin: info.pubcoin } }),
        (result) => {
          logger.info('getMintMetadata: ' + JSON.stringify(result))
          this.retrievedMints = mints.map((info, index) => {
            const response = result[index]
            let groupId = -1
            let height = -1
            try {
              height = Object.keys(response)[0]
              groupId = response[height]
            } catch (e) { }

            return { pubcoin: info.pubcoin, groupId, height: Number(height) }
          })
        },
        (e: Error) => {
          this.retrievedMints = []
          this.handleMessageError(uri, 'Failed getting mint metadata', e)
        })
    }

    if (this.anonymitySetToRetrieve) {
      const denom = this.anonymitySetToRetrieve.denom
      const groupId = this.anonymitySetToRetrieve.groupId
      this.anonymitySetToRetrieve = null
      return getAnonymitySet(denom, groupId + '',
        (result) => {
          logger.info('getAnonymitySet: ' + JSON.stringify(result))
          this.retrievedAnonymitySet = result
        },
        (e: Error) => {
          this.retrievedAnonymitySet = { blockHash: '', serializedCoins: [] }
          this.handleMessageError(uri, 'Failed getting anonymity set', e)
        })
    }

    if (this.retrievedUsedSerials) {
      this.retrievedUsedSerials = false
      return getUsedCoinSerials(
        (result) => {
          logger.info('getUsedCoinSerials: ' + JSON.stringify(result))
          this.usedSerials = result
        },
        (e: Error) => {
          this.usedSerials = { serials: [] }
          this.handleMessageError(uri, 'Failed getting used coin serials', e)
        })
    }

    if (this.retrievedCoinGroup) {
      this.retrievedCoinGroup = false
      return getLatestCoinIds(
        (result) => {
          logger.info('getLatestCoinIds: ' + JSON.stringify(result))
          this.coinGroup = result
        },
        (e: Error) => {
          this.coinGroup = []
          this.handleMessageError(uri, 'Failed getting used coin serials', e)
        })
    }
  }

  async load () {
    logger.info(`${this.walletId} - Loading wallet engine caches`)

    // Load transaction data cache:
    try {
      if (!this.txFile || this.txFile === '') throw new Error('Missing txFile')
      const txCacheText = await this.localDisklet.getText(this.txFile)
      const txCacheJson = JSON.parse(txCacheText)

      // TODO: Validate JSON
      const { txs } = txCacheJson
      if (!txs) throw new Error('Missing txs in cache')

      // Update the derived information:
      const parsedTxs = {}
      for (const txid of Object.keys(txs)) {
        parsedTxs[txid] = parseTransaction(txs[txid])
      }

      // Update the cache on success:
      this.txCache = txs
      this.parsedTxs = parsedTxs
    } catch (e) {
      logger.info(`${this.walletId}: Failed to load transaction cache: ${e}`)
    }

    // Load the address and height caches.
    // Must come after transactions are loaded for proper txid filtering:
    try {
      if (!this.addressFile || this.addressFile === '') {
        throw new Error('Missing addressFile')
      }
      const cacheText = await this.localDisklet.getText(this.addressFile)
      const cacheJson = JSON.parse(cacheText)

      // TODO: Validate JSON
      if (!cacheJson.addresses) throw new Error('Missing addresses in cache')
      if (!cacheJson.heights) throw new Error('Missing heights in cache')

      // Update the cache:
      this.addressCache = cacheJson.addresses
      this.txHeightCache = cacheJson.heights

      // Fill up the missing headers to fetch
      for (const txid in this.txHeightCache) {
        const height = this.txHeightCache[txid].height
        if (height > 0 && !this.pluginState.headerCache[`${height}`]) {
          this.missingHeaders[`${height}`] = true
        }
      }

      // Update the derived information:
      for (const scriptHash of Object.keys(this.addressCache)) {
        const address = this.addressCache[scriptHash]
        for (const txid of address.txids) this.handleNewTxid(txid)
        for (const utxo of address.utxos) this.handleNewTxid(utxo.txid)
        this.scriptHashes[address.displayAddress] = scriptHash
        this.refreshAddressInfo(scriptHash)
      }

      // update the spend transactions
      try {
        const mintDataStr = await this.encryptedLocalDisklet.getText(SIGMA_ENCRYPTED_FILE)
        if (mintDataStr) {
          const mintData = JSON.parse(mintDataStr)
          mintData.forEach((item) => {
            if (item.spendTxId) {
              this.handleNewTxid(item.spendTxId, true)
            }
          })
        }
      }
      catch (e) {
        logger.info(`${this.walletId}: Failed to load spend transactions: ${e}`)
      }
    } catch (e) {
      this.addressCache = {}
      this.addressInfos = {}
      this.txHeightCache = {}
      logger.info(`${this.walletId}: Failed to load address cache: ${e}`)
    }

    return this
  }

  async clearCache () {
    this.addressCache = {}
    this.addressInfos = {}
    this.scriptHashes = {}
    this.usedAddresses = {}
    this.txCache = {}
    this.parsedTxs = {}
    this.txHeightCache = {}
    this.connections = {}
    this.serverStates = {}
    this.fetchingTxs = {}
    this.missingTxs = {}
    this.fetchingHeaders = {}
    this.missingHeaders = {}
    this.txCacheDirty = true
    this.addressCacheDirty = true
    await this.saveAddressCache()
    await this.saveTxCache()
  }

  async saveAddressCache () {
    if (this.addressCacheDirty) {
      try {
        const json = JSON.stringify({
          addresses: this.addressCache,
          heights: this.txHeightCache
        })
        if (!this.addressFile || this.addressFile === '') {
          throw new Error('Missing addressFile')
        }
        await this.localDisklet.setText(this.addressFile, json)
        logger.info(`${this.walletId} - Saved address cache`)
        this.addressCacheDirty = false
      } catch (e) {
        logger.info(`${this.walletId} - saveAddressCache - ${e.toString()}`)
      }
    }
  }

  async saveTxCache () {
    if (this.txCacheDirty) {
      try {
        if (!this.txFile || this.txFile === '') {
          throw new Error('Missing txFile')
        }
        const json = JSON.stringify({ txs: this.txCache })
        await this.localDisklet.setText(this.txFile, json)
        logger.info(`${this.walletId}: Saved txCache`)
        this.txCacheDirty = false
      } catch (e) {
        logger.info(`${this.walletId}: Error saving txCache: ${e.toString()}`)
      }
    }
  }

  dirtyAddressCache () {
    this.addressCacheDirty = true
    if (this.progressRatio === 1) this.saveAddressCache()
  }

  dirtyTxCache () {
    this.txCacheDirty = true
    if (this.progressRatio === 1) this.saveTxCache()
  }

  findBestServer (address: string) {
    let bestTime = 0
    let bestUri = ''
    for (const uri of Object.keys(this.connections)) {
      const time = this.serverStates[uri].addresses[address].lastUpdate
      if (bestTime < time) {
        bestTime = time
        bestUri = uri
      }
    }
    return bestUri
  }

  serverCanGetTx (uri: string, txid: string) {
    // If we have it, we can get it:
    if (this.serverStates[uri].txids[txid]) return true

    // If somebody else has it, let them get it:
    for (const uri of Object.keys(this.connections)) {
      if (this.serverStates[uri].txids[txid]) return false
    }

    // If nobody has it, we can try getting it:
    return true
  }

  serverCanGetHeader (uri: string, height: string) {
    // If we have it, we can get it:
    if (this.serverStates[uri].headers[height]) return true

    // If somebody else has it, let them get it:
    for (const uri of Object.keys(this.connections)) {
      if (this.serverStates[uri].headers[height]) return false
    }

    // If nobody has it, we can try getting it:
    return true
  }

  // A server has sent a header, so update the cache and txs:
  handleHeaderFetch (height: string, header: StratumBlockHeader) {
    if (!this.pluginState.headerCache[height]) {
      this.pluginState.headerCache[height] = header
      const affectedTXIDS = this.findAffectedTransactions(height)
      for (const txid of affectedTXIDS) {
        if (this.parsedTxs[txid]) this.onTxFetched(txid)
      }
      this.pluginState.dirtyHeaderCache()
    }
    delete this.missingHeaders[height]
  }

  // A server has sent address history data, so update the caches:
  handleHistoryFetch (
    scriptHash: string,
    addressState: AddressState,
    history: Array<StratumHistoryRow>
  ) {
    // Process the txid list:
    const txidList: Array<string> = []
    for (const row of history) {
      txidList.push(row.tx_hash)
      this.handleTxidFetch(row.tx_hash, row.height)
    }

    // Save to the address cache:
    addressState.synced = true
    this.addressCache[scriptHash].txids = txidList
    this.addressCache[scriptHash].txidStratumHash = addressState.hash || ''
    this.updateProgressRatio()
    this.refreshAddressInfo(scriptHash)
    this.dirtyAddressCache()
  }

  // A server has sent a transaction, so update the caches:
  handleTxFetch (txid: string, txData: string) {
    const parsedTx = parseTransaction(txData)
    this.txCache[txid] = txData
    this.parsedTxs[txid] = parsedTx
    delete this.missingTxs[txid]
    for (const scriptHash of this.findAffectedAddressesForInputs(txid)) {
      this.refreshAddressInfo(scriptHash)
    }
    this.dirtyTxCache()
    this.onTxFetched(txid)
    for (const scriptHash of this.findAffectedAddressesForOutput(txid)) {
      this.refreshAddressInfo(scriptHash)
      for (const parsedTxid of this.addressInfos[scriptHash].txids) {
        const tx = this.parsedTxs[parsedTxid]
        for (const input of tx.inputs) {
          if (input.prevout) {
            const hash = input.prevout.rhash()
            if (hash === txid && this.parsedTxs[hash]) {
              this.onTxFetched(parsedTxid)
            }
          }
        }
      }
    }
  }

  // A server has told us about a txid, so update the caches:
  handleTxidFetch (txid: string, height: number) {
    height = height || -1
    // Save to the height cache:
    if (this.txHeightCache[txid]) {
      const prevHeight = this.txHeightCache[txid].height
      this.txHeightCache[txid].height = height
      if (
        this.parsedTxs[txid] &&
        (prevHeight === -1 || !prevHeight) &&
        height !== -1
      ) {
        this.onTxFetched(txid)
      }
    } else {
      this.txHeightCache[txid] = {
        firstSeen: Date.now(),
        height
      }
    }
    // Add to the missing headers list:
    if (height > 0 && !this.pluginState.headerCache[`${height}`]) {
      this.missingHeaders[`${height}`] = true
    }

    this.handleNewTxid(txid)
  }

  // Someone has detected a potentially new txid, so update tables:
  handleNewTxid (txid: string, verbose: boolean = false) {
    if (verbose) {
      this.missingTxsVerbose[txid] = true
      return
    }

    // Add to the relevant txid list:
    if (typeof this.fetchingTxs[txid] !== 'boolean') {
      this.fetchingTxs[txid] = false
    }

    // Add to the missing tx list:
    if (!this.txCache[txid]) {
      this.missingTxs[txid] = true
    }
  }

  // A server has sent UTXO data, so update the caches:
  handleUtxoFetch (
    scriptHash: string,
    stateHash: string,
    utxos: Array<StratumUtxo>
  ) {
    // Process the UTXO list:
    const utxoList: Array<UtxoInfo> = []
    for (const utxo of utxos) {
      utxoList.push({
        txid: utxo.tx_hash,
        index: utxo.tx_pos,
        value: utxo.value
      })
      this.handleTxidFetch(utxo.tx_hash, utxo.height)
    }

    // Save to the address cache:
    this.addressCache[scriptHash].utxos = utxoList
    this.addressCache[scriptHash].utxoStratumHash = stateHash
    this.refreshAddressInfo(scriptHash)
    this.dirtyAddressCache()
  }

  /**
   * If an entry changes in the address cache,
   * update the derived info:
   */
  refreshAddressInfo (scriptHash: string) {
    const address = this.addressCache[scriptHash]
    if (!address) return
    const { displayAddress, path, redeemScript } = address

    // It is used if it has transactions or if the metadata says so:
    const used =
      this.usedAddresses[scriptHash] ||
      address.txids.length + address.utxos.length !== 0

    // We only include existing stuff:
    const txids = address.txids.filter(txid => this.txCache[txid])
    const utxos = address.utxos.filter(utxo => this.txCache[utxo.txid])

    // Make a list of unconfirmed transactions for the utxo search:
    const pendingTxids = txids.filter(
      txid =>
        this.txHeightCache[txid].height <= 0 &&
        !utxos.find(utxo => utxo.txid === txid)
    )

    // Add all our own unconfirmed outpoints to the utxo list:
    for (const txid of pendingTxids) {
      const tx = this.parsedTxs[txid]
      for (let i = 0; i < tx.outputs.length; ++i) {
        const output = tx.outputs[i]
        if (output.scriptHash === scriptHash) {
          utxos.push({ txid, index: i, value: output.value })
        }
      }
    }

    // Make a table of spent outpoints for filtering the UTXO list:
    const spends = {}
    for (const txid of pendingTxids) {
      const tx = this.parsedTxs[txid]
      for (const input of tx.inputs) {
        spends[`${input.prevout.rhash()}:${input.prevout.index}`] = true
      }
    }

    const utxosWithUnconfirmed = utxos.filter(
      utxo => !spends[`${utxo.txid}:${utxo.index}`]
    )

    const balance = utxosWithUnconfirmed.reduce((s, utxo) => utxo.value + s, 0)

    let prevBalance = 0
    let prevUsed = false
    if (this.addressInfos[scriptHash]) {
      prevBalance = this.addressInfos[scriptHash].balance
      prevUsed = this.addressInfos[scriptHash].used
    }

    // Assemble the info structure:
    this.addressInfos[scriptHash] = {
      txids,
      utxos: utxosWithUnconfirmed,
      used,
      displayAddress,
      path,
      balance,
      redeemScript
    }

    if (prevBalance !== balance) this.onBalanceChanged()
    if (prevUsed !== used) this.onAddressUsed()
  }

  findAffectedAddressesForInputs (txid: string): Array<string> {
    const scriptHashSet = []
    for (const input of this.parsedTxs[txid].inputs) {
      const prevTx = this.parsedTxs[input.prevout.rhash()]
      if (!prevTx) continue
      const prevOut = prevTx.outputs[input.prevout.index]
      if (!prevOut) continue
      scriptHashSet.push(prevOut.scriptHash)
    }
    return scriptHashSet
  }

  findAffectedAddressesForOutput (txid: string): Array<string> {
    const scriptHashSet = []
    for (const output of this.parsedTxs[txid].outputs) {
      if (this.addressCache[output.scriptHash]) {
        scriptHashSet.push(output.scriptHash)
      }
    }
    return scriptHashSet
  }

  findAffectedAddresses (txid: string): Array<string> {
    const inputs = this.findAffectedAddressesForInputs(txid)
    const outputs = this.findAffectedAddressesForOutput(txid)
    return inputs.concat(outputs)
  }

  // Finds the txids that a are in a block.
  findAffectedTransactions (height: string): Array<string> {
    const txids = []
    for (const txid in this.txHeightCache) {
      const tx = this.txHeightCache[txid]
      if (`${tx.height}` === height) txids.push(txid)
    }
    return txids
  }

  handleMessageError (uri: string, task: string, e: Error) {
    const msg = `connection closed ERROR: ${e.message}`
    logger.info(
      `${this.walletId}: ${uri.replace(
        'electrum://',
        ''
      )}: ${msg}: task: ${task}`
    )
    if (this.connections[uri]) {
      this.connections[uri].handleError(e)
    }
  }

  populateServerAddresses (uri: string) {
    const serverState = this.serverStates[uri]
    for (const address of Object.keys(this.addressInfos)) {
      if (!serverState.addresses[address]) {
        serverState.addresses[address] = {
          fetchingTxids: false,
          fetchingUtxos: false,
          hash: null,
          lastUpdate: 0,
          subscribed: false,
          subscribing: false,
          synced: false
        }
      }
    }
  }

  retrieveMintMetadata (mints: { denom: number, pubcoin: string }[]): Promise<MintMetadata[]> {
    return new Promise((resolve, reject) => {
      this.mintsToRetrieve = mints
      this.retrievedMints = null

      const checkResponse = () => {
        if (this.retrievedMints) {
          resolve(this.retrievedMints)
        } else {
          // wake up connections
          this.wakeUpConnections()
          setTimeout(checkResponse, 2000)
        }
      }
      checkResponse()
    })
  }

  retrieveAnonymitySet (denom: number, groupId: number): Promise<AnonymitySet> {
    return new Promise((resolve, reject) => {
      this.anonymitySetToRetrieve = { denom, groupId }
      this.retrievedAnonymitySet = null

      const checkResponse = () => {
        if (this.retrievedAnonymitySet) {
          resolve(this.retrievedAnonymitySet)
        } else {
          // wake up connections
          this.wakeUpConnections()
          setTimeout(checkResponse, 2000)
        }
      }
      checkResponse()
    })
  }

  retrieveUsedCoinSerials (): Promise<UsedSerials> {
    return new Promise((resolve, reject) => {
      this.retrievedUsedSerials = true
      this.usedSerials = null

      const checkResponse = () => {
        if (this.usedSerials) {
          resolve(this.usedSerials)
        } else {
          // wake up connections
          this.wakeUpConnections()
          setTimeout(checkResponse, 2000)
        }
      }
      checkResponse()
    })
  }

  retrieveLatestCoinIds (): Promise<CoinGroup[]> {
    return new Promise((resolve, reject) => {
      this.retrievedCoinGroup = true
      this.coinGroup = null

      const checkResponse = () => {
        if (this.coinGroup) {
          resolve(this.coinGroup)
        } else {
          // wake up connections
          this.wakeUpConnections()
          setTimeout(checkResponse, 2000)
        }
      }
      checkResponse()
    })
  }

  wakeUpConnections () {
    Object.keys(this.connections).forEach(uri => {
      this.connections[uri].doWakeUp()
    })
  }
}
