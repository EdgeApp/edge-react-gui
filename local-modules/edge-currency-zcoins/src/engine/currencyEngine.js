// @flow

import { bns } from 'biggystring'
import { type Disklet } from 'disklet'
import {
  type EdgeCurrencyEngine,
  type EdgeCurrencyEngineCallbacks,
  type EdgeCurrencyEngineOptions,
  type EdgeDataDump,
  type EdgeFreshAddress,
  type EdgeGetTransactionsOptions,
  type EdgePaymentProtocolInfo,
  type EdgeSpendInfo,
  type EdgeSpendTarget,
  type EdgeTransaction,
  type EdgeWalletInfo,
  InsufficientFundsError
} from 'edge-core-js/types'

import { InfoServer } from '../info/constants'
import { type PluginIo } from '../plugin/pluginIo.js'
import { PluginState } from '../plugin/pluginState.js'
import {
  toLegacyFormat,
  validAddress
} from '../utils/addressFormat/addressFormatIndex.js'
import type { TxOptions, SpendCoin } from '../utils/coinUtils.js'
import {
  addressToScriptHash,
  getReceiveAddresses,
  parseJsonTransactionForSpend,
  parseJsonTransaction,
  signBitcoinMessage,
  sumTransaction,
  sumUtxos,
  verifyTxAmount,
  getMintCommitmentsForValue,
  privateCoin
} from '../utils/coinUtils.js'
import type { BitcoinFees, EarnComFees } from '../utils/flowTypes.js'
import { getAllAddresses } from '../utils/formatSelector.js'
import {
  EarnComFeesSchema,
  InfoServerFeesSchema
} from '../utils/jsonSchemas.js'
import { logger } from '../utils/logger.js'
import { promiseAny, validateObject } from '../utils/utils.js'
import { broadcastFactories } from './broadcastApi.js'
import { EngineState } from './engineState.js'
import type { EngineStateCallbacks } from './engineState.js'
import { KeyManager } from './keyManager'
import type { KeyManagerCallbacks } from './keyManager'
import { calcFeesFromEarnCom, calcMinerFeePerByte } from './miningFees.js'
import {
  createPayment,
  getPaymentDetails,
  sendPayment
} from './paymentRequest.js'

import {
  OP_SIGMA_MINT,
  SIGMA_ENCRYPTED_FILE,
  RESTORE_FILE,
  denominations,
  type PrivateCoin
} from '../utils/sigma/sigmaTypes'

const BYTES_TO_KB = 1000
const MILLI_TO_SEC = 1000

export function snooze (ms: number): Promise<void> {
  return new Promise((resolve: any) => setTimeout(resolve, ms))
}

export type EngineCurrencyInfo = {
  // Required Settings
  network: string, // The offical network in lower case - Needs to match the Bitcoin Lib Network Type
  currencyCode: string, // The offical currency code in upper case - Needs to match the EdgeCurrencyInfo currencyCode
  gapLimit: number,
  defaultFee: number,
  feeUpdateInterval: number,
  customFeeSettings: Array<string>,
  simpleFeeSettings: {
    highFee: string,
    lowFee: string,
    standardFeeLow: string,
    standardFeeHigh: string,
    standardFeeLowAmount: string,
    standardFeeHighAmount: string
  },

  // Optional Settings
  useSigma: boolean,
  forks?: Array<string>,
  feeInfoServer?: string,
  timestampFromHeader?: (header: Buffer, height: number) => number
}

export type CurrencyEngineSettings = {
  walletInfo: EdgeWalletInfo,
  engineInfo: EngineCurrencyInfo,
  pluginState: PluginState,
  options: EdgeCurrencyEngineOptions,
  io: PluginIo
}
/**
 * The core currency plugin.
 * Provides information about the currency,
 * as well as generic (non-wallet) functionality.
 */
export class CurrencyEngine {
  walletInfo: EdgeWalletInfo
  walletId: string
  prunedWalletId: string
  engineInfo: EngineCurrencyInfo
  currencyCode: string
  network: string
  keyManager: KeyManager
  engineState: EngineState
  pluginState: PluginState
  callbacks: EdgeCurrencyEngineCallbacks
  walletLocalDisklet: Disklet
  walletLocalEncryptedDisklet: Disklet
  io: PluginIo
  feeUpdateInterval: number
  feeTimer: any
  timers: any
  engineOn: boolean
  fees: BitcoinFees
  otherMethods: Object
  currentMaxIndex: number
  savedSpendTransactionValues: { [key: string]: number }
  pendingSpendTransactionResync: boolean
  
  // ------------------------------------------------------------------------
  // Private API
  // ------------------------------------------------------------------------
  constructor({
    walletInfo,
    engineInfo,
    pluginState,
    options,
    io
  }: CurrencyEngineSettings) {
    // Validate that we are a valid EdgeCurrencyEngine:
    // eslint-disable-next-line no-unused-vars
    const test: EdgeCurrencyEngine = this
    this.walletInfo = walletInfo
    this.walletId = walletInfo.id || ''
    this.prunedWalletId = this.walletId.slice(0, 6)
    this.pluginState = pluginState
    this.callbacks = options.callbacks
    this.walletLocalDisklet = options.walletLocalDisklet
    this.walletLocalEncryptedDisklet = options.walletLocalEncryptedDisklet
    this.io = io
    this.engineInfo = engineInfo
    this.feeUpdateInterval = this.engineInfo.feeUpdateInterval
    this.currencyCode = this.engineInfo.currencyCode
    this.network = this.engineInfo.network

    this.fees = { ...engineInfo.simpleFeeSettings, timestamp: 0 }
    logger.info(
      `${this.prunedWalletId}: create engine type: ${this.walletInfo.type}`
    )

    this.otherMethods = {
      signMessageBase64: async (
        message: string,
        address: string
      ): Promise<string> => {
        const key = await this.keyManager.getKeyForAddress(address)
        const signature = await signBitcoinMessage(message, key)
        return signature
      }
    }
    this.savedSpendTransactionValues = {}
  }

  async load (): Promise<any> {
    const engineStateCallbacks: EngineStateCallbacks = {
      onHeightUpdated: this.callbacks.onBlockHeightChanged,
      onTxFetched: (txid: string) => {
        if (txid in this.savedSpendTransactionValues) {
          const edgeTransaction = this.getTransactionSync(txid, this.savedSpendTransactionValues[txid])
          this.callbacks.onTransactionsChanged([edgeTransaction])
        } else {
          this.getSpendTransactionValues()
            .then(spendTransactionValues => {
              const edgeTransaction = this.getTransactionSync(txid, spendTransactionValues[txid])
              this.callbacks.onTransactionsChanged([edgeTransaction])
            })
        }
      },
      onAddressesChecked: this.callbacks.onAddressesChecked
    }

    this.engineState = new EngineState({
      files: { txs: 'txs.json', addresses: 'addresses.json' },
      callbacks: engineStateCallbacks,
      io: this.io,
      localDisklet: this.walletLocalDisklet,
      encryptedLocalDisklet: this.walletLocalEncryptedDisklet,
      pluginState: this.pluginState,
      walletId: this.prunedWalletId,
      engineInfo: this.engineInfo
    })

    await this.engineState.load()

    const callbacks: KeyManagerCallbacks = {
      onNewAddress: (
        scriptHash: string,
        address: string,
        path: string,
        redeemScript?: string
      ) => {
        return this.engineState.addAddress(
          scriptHash,
          address,
          path,
          redeemScript
        )
      },
      onNewKey: (keys: any) => this.engineState.saveKeys(keys)
    }

    const cachedRawKeys = await this.engineState.loadKeys()
    // $FlowFixMe master is missing in object literal
    const { master = {}, ...otherKeys } = cachedRawKeys || {}
    const keys = this.walletInfo.keys || {}
    const { format, coinType = -1 } = keys
    const seed = keys[`${this.network}Key`]
    const xpub = keys[`${this.network}Xpub`]
    const rawKeys = { ...otherKeys, master: { xpub, ...master } }

    logger.info(
      `${this.walletId} - Created Wallet Type ${format} for Currency Plugin ${
        this.pluginState.pluginName
      }`
    )

    this.keyManager = new KeyManager({
      seed: seed,
      bip: format,
      coinType: coinType,
      rawKeys: rawKeys,
      callbacks: callbacks,
      gapLimit: this.engineInfo.gapLimit,
      network: this.network,
      engineState: this.engineState
    })

    this.engineState.onAddressUsed = () => {
      this.keyManager.setLookAhead()
    }

    this.engineState.onBalanceChanged = () => {
      this.callbacks.onBalanceChanged(this.currencyCode, this.getBalance({ mintedBalance: this.engineInfo.useSigma }))
    }

    await this.keyManager.load()
  }

  async getTransaction (txid: string, spendValue: number): Promise<EdgeTransaction> {
    await snooze(3) // Give up a tick so some GUI rendering can happen
    return this.getTransactionSync(txid, spendValue)
  }

  getTransactionSync (txid: string, spendValue: number): EdgeTransaction {
    const { height = -1, firstSeen = Date.now() / 1000 } =
      this.engineState.txHeightCache[txid] || {}
    let date = firstSeen
    // If confirmed, we will try and take the timestamp as the date
    if (height && height !== -1) {
      const blockHeight = this.pluginState.headerCache[`${height}`]
      if (blockHeight) {
        date = blockHeight.timestamp
      }
    }
    
    // Get parsed bcoin tx from engine
    const bcoinTransaction = this.engineState.parsedTxs[txid]
    if (!bcoinTransaction) {
      throw new Error('Transaction not found')
    }

    const { fee, ourReceiveAddresses, nativeAmount, isMint } = sumTransaction(
      bcoinTransaction,
      this.network,
      this.engineState,
      spendValue
    )

    const sizes = bcoinTransaction.getSizes()
    const debugInfo = `Inputs: ${bcoinTransaction.inputs.length}\nOutputs: ${
      bcoinTransaction.outputs.length
    }\nSize: ${sizes.size}\nWitness: ${sizes.witness}`
    const edgeTransaction: EdgeTransaction = {
      ourReceiveAddresses,
      currencyCode: this.currencyCode,
      otherParams: {
        debugInfo,
        isMint
      },
      txid: txid,
      date: date,
      blockHeight: height === -1 ? 0 : height,
      nativeAmount: `${nativeAmount}`,
      networkFee: `${fee}`,
      signedTx: this.engineState.txCache[txid]
    }
    return edgeTransaction
  }

  async getSpendTransactionValues (): Promise<{ [key: string]: number }> {
    // Get existing spend transaction ids
    const spendTransactionValues = {}
    try {
      const mintDataStr = await this.walletLocalEncryptedDisklet.getText(SIGMA_ENCRYPTED_FILE)
      if (mintDataStr) {
        const mintData = JSON.parse(mintDataStr)
        mintData.forEach((item) => {
          if (item.spendTxId) {
            if (!(item.spendTxId in spendTransactionValues)) {
              spendTransactionValues[item.spendTxId] = 0
            }
            spendTransactionValues[item.spendTxId] += item.value
          }
        })
      }
    }
    catch (e) {
      logger.info(`${this.walletId}: Failed to retrieve spend transaction ids: ${e}`)
    }

    return spendTransactionValues;
  }

  async updateFeeFromEdge () {
    try {
      const url = `${InfoServer}/networkFees/${this.currencyCode}`
      const feesResponse = await this.io.fetch(url)
      const feesJson = await feesResponse.json()
      if (validateObject(feesJson, InfoServerFeesSchema)) {
        this.fees = { ...this.fees, ...feesJson }
      } else {
        throw new Error('Fetched invalid networkFees')
      }
    } catch (err) {
      logger.info(`${this.prunedWalletId} - ${err.toString()}`)
    }
  }

  async updateFeeFromVendor () {
    const { feeInfoServer } = this.engineInfo
    if (!feeInfoServer || feeInfoServer === '') {
      clearTimeout(this.feeTimer)
      return
    }
    try {
      if (Date.now() - this.fees.timestamp > this.feeUpdateInterval) {
        const results = await this.io.fetch(feeInfoServer)
        if (results.status !== 200) {
          throw new Error(results.body)
        }
        const feesJson: EarnComFees = await results.json()
        if (validateObject(feesJson, EarnComFeesSchema)) {
          const newFees = calcFeesFromEarnCom(feesJson.fees)
          this.fees = { ...this.fees, ...newFees }
          this.fees.timestamp = Date.now()
        } else {
          throw new Error('Fetched invalid networkFees')
        }
      }
    } catch (e) {
      logger.info(
        `${
          this.prunedWalletId
        } - Error while trying to update fee table ${e.toString()}`
      )
    }
    this.feeTimer = setTimeout(
      () => this.updateFeeFromVendor(),
      this.feeUpdateInterval
    )
  }

  getRate ({
    spendTargets,
    networkFeeOption = 'standard',
    customNetworkFee = {},
    otherParams
  }: EdgeSpendInfo): number {
    if (
      otherParams &&
      otherParams.paymentProtocolInfo &&
      otherParams.paymentProtocolInfo.merchant &&
      otherParams.paymentProtocolInfo.merchant.requiredFeeRate
    ) {
      const requiredFeeRate =
        otherParams.paymentProtocolInfo.merchant.requiredFeeRate
      return Math.ceil(parseFloat(requiredFeeRate) * BYTES_TO_KB * 1.5)
    }
    const customFeeSetting = this.engineInfo.customFeeSettings[0]
    const customFeeAmount = customNetworkFee[customFeeSetting] || '0'
    if (networkFeeOption === 'custom' && customFeeAmount !== '0') {
      // customNetworkFee is in sat/Bytes in need to be converted to sat/KB
      return parseInt(customFeeAmount) * BYTES_TO_KB
    } else {
      const amountForTx = spendTargets
        .reduce((s, { nativeAmount }) => s + parseInt(nativeAmount), 0)
        .toString()
      const rate = calcMinerFeePerByte(
        amountForTx,
        networkFeeOption,
        this.fees,
        customFeeAmount
      )
      return parseInt(rate) * BYTES_TO_KB
    }
  }

  logEdgeTransaction (edgeTransaction: EdgeTransaction, action: string) {
    let log = `------------------ ${action} Transaction ------------------\n`
    log += `Transaction id: ${edgeTransaction.txid}\n`
    log += `Our Receiving addresses are: ${edgeTransaction.ourReceiveAddresses.toString()}\n`
    log += 'Transaction details:\n'
    if (edgeTransaction.otherParams && edgeTransaction.otherParams.txJson) {
      log += JSON.stringify(edgeTransaction.otherParams.txJson, null, 2) + '\n'
    }
    log += '------------------------------------------------------------------'
    logger.info(`${this.prunedWalletId}: ${log}`)
  }

  // ------------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------------

  async changeUserSettings (userSettings: Object): Promise<mixed> {
    await this.pluginState.updateServers(userSettings)
  }

  async startEngine (): Promise<void> {
    this.engineOn = true
    this.callbacks.onBalanceChanged(this.currencyCode, this.getBalance({ mintedBalance: this.engineInfo.useSigma }))
    this.updateFeeFromEdge().then(() => this.updateFeeFromVendor())

    if (this.engineInfo.useSigma) {
      this.addToLoop('mintLoop', 60000)
    }

    return this.engineState.connect()
  }

  async killEngine (): Promise<void> {
    // Set status flag to false
    this.engineOn = false
    // Clear Inner loops timers
    for (const timer in this.timers) {
      clearTimeout(this.timers[timer])
    }

    clearTimeout(this.feeTimer)
    return this.engineState.disconnect()
  }

  async resyncBlockchain (): Promise<void> {
    this.pendingSpendTransactionResync = true
    await this.killEngine()
    await this.engineState.clearCache()
    await this.pluginState.clearCache()
    await this.keyManager.reload()
    await this.startEngine()
    if (this.engineInfo.useSigma) {
      window.setTimeout(() => {
        this.forceReloadSpendTransactions()
        this.engineState.wakeUpConnections()
        this.pendingSpendTransactionResync = false
      }, 5000)
    }
  }

  getBlockHeight (): number {
    return this.pluginState.height
  }

  async enableTokens (tokens: Array<string>): Promise<void> {}

  async getEnabledTokens (): Promise<Array<string>> {
    return []
  }

  addCustomToken (token: any): Promise<void> {
    return Promise.reject(new Error('This plugin has no tokens'))
  }

  disableTokens (tokens: Array<string>): Promise<void> {
    return Promise.reject(new Error('This plugin has no tokens'))
  }

  getTokenStatus (token: string): boolean {
    return false
  }

  getBalance (options: any): string {
    return this.engineState.getBalance(options)
  }

  getNumTransactions (options: any): number {
    return this.engineState.getNumTransactions(options)
  }

  async getTransactions (
    options: EdgeGetTransactionsOptions
  ): Promise<Array<EdgeTransaction>> {
    const rawTxs = this.engineState.txCache
    const edgeTransactions = []
    const spendTransactionValues = await this.getSpendTransactionValues()
    for (const txid in rawTxs) {
      const edgeTransaction = await this.getTransaction(txid, spendTransactionValues[txid])
      edgeTransactions.push(edgeTransaction)
    }

    const startIndex = (options && options.startIndex) || 0
    let endIndex =
      (options && options.startEntries + startIndex) || edgeTransactions.length
    if (startIndex + endIndex > edgeTransactions.length) {
      endIndex = edgeTransactions.length
    }
    return edgeTransactions.slice(startIndex, endIndex)
  }

  getFreshAddress (options: any): EdgeFreshAddress {
    const publicAddress = this.keyManager.getReceiveAddress()
    const legacyAddress = toLegacyFormat(publicAddress, this.network)
    return { publicAddress, legacyAddress }
  }

  addGapLimitAddresses (addresses: Array<string>, options: any): void {
    const scriptHashPromises = addresses.map(address => {
      const scriptHash = this.engineState.scriptHashes[address]
      if (typeof scriptHash === 'string') return Promise.resolve(scriptHash)
      else return addressToScriptHash(address, this.network)
    })
    Promise.all(scriptHashPromises)
      .then((scriptHashs: Array<string>) => {
        this.engineState.markAddressesUsed(scriptHashs)
        if (this.keyManager) this.keyManager.setLookAhead()
      })
      .catch(e => logger.info(`${this.prunedWalletId}: ${e.toString()}`))
  }

  isAddressUsed (address: string, options: any): boolean {
    if (!validAddress(address, this.network)) {
      throw new Error('Wrong formatted address')
    }
    for (const scriptHash in this.engineState.addressInfos) {
      if (
        this.engineState.addressInfos[scriptHash].displayAddress === address
      ) {
        return this.engineState.addressInfos[scriptHash].used
      }
    }
    return false
  }

  async sweepPrivateKeys (
    edgeSpendInfo: EdgeSpendInfo,
    options?: any = {}
  ): Promise<EdgeTransaction> {
    const { privateKeys = [] } = edgeSpendInfo
    if (!privateKeys.length) throw new Error('No private keys given')
    let success, failure
    const end = new Promise((resolve, reject) => {
      success = resolve
      failure = reject
    })
    const engineStateCallbacks: EngineStateCallbacks = {
      onAddressesChecked: (ratio: number) => {
        if (ratio === 1) {
          engineState.disconnect()
          options.subtractFee = true
          const utxos = engineState.getUTXOs()
          if (!utxos || !utxos.length) {
            failure(new Error('Private key has no funds'))
          }
          const publicAddress = this.getFreshAddress().publicAddress
          const nativeAmount = engineState.getBalance()
          options.utxos = utxos
          edgeSpendInfo.spendTargets = [{ publicAddress, nativeAmount }]
          this.makeSpend(edgeSpendInfo, options)
            .then(tx => success(tx))
            .catch(e => failure(e))
        }
      }
    }

    const engineState = new EngineState({
      files: { txs: '', addresses: '' },
      callbacks: engineStateCallbacks,
      io: this.io,
      localDisklet: this.walletLocalDisklet,
      encryptedLocalDisklet: this.walletLocalEncryptedDisklet,
      pluginState: this.pluginState,
      walletId: this.prunedWalletId,
      engineInfo: this.engineInfo
    })

    await engineState.load()
    const addresses = await getAllAddresses(privateKeys, this.network)
    addresses.forEach(({ address, scriptHash }) =>
      // $FlowFixMe missing path parameter
      engineState.addAddress(scriptHash, address)
    )
    engineState.connect()

    return end
  }

  async getPaymentProtocolInfo (
    paymentProtocolURL: string
  ): Promise<EdgePaymentProtocolInfo> {
    try {
      return getPaymentDetails(
        paymentProtocolURL,
        this.network,
        this.currencyCode,
        this.io.fetch
      )
    } catch (err) {
      logger.info(`${this.prunedWalletId} - ${err.toString()}`)
      throw err
    }
  }

  async makeSpend (
    edgeSpendInfo: EdgeSpendInfo,
    txOptions?: TxOptions = {}
  ): Promise<EdgeTransaction> {
    if (this.engineInfo.useSigma) {
      return this.makeSigmaSpend(edgeSpendInfo, txOptions)
    }
    const { spendTargets } = edgeSpendInfo
    // Can't spend without outputs
    if (!txOptions.CPFP && (!spendTargets || spendTargets.length < 1)) {
      throw new Error('Need to provide Spend Targets')
    }
    // Calculate the total amount to send
    const totalAmountToSend = spendTargets.reduce(
      (sum, { nativeAmount }) => bns.add(sum, nativeAmount || '0'),
      '0'
    )
    // Try and get UTXOs from `txOptions`, if unsuccessful use our own utxo's
    const { utxos = this.engineState.getUTXOs() } = txOptions
    // Test if we have enough to spend
    if (bns.gt(totalAmountToSend, `${sumUtxos(utxos)}`)) {
      throw new InsufficientFundsError()
    }
    try {
      // Get the rate according to the latest fee
      const rate = this.getRate(edgeSpendInfo)
      logger.info(`spend: Using fee rate ${rate} sat/K`)
      // Create outputs from spendTargets

      const outputs = []
      for (const spendTarget of spendTargets) {
        const {
          publicAddress: address,
          nativeAmount,
          otherParams: { script } = {}
        } = spendTarget
        const value = parseInt(nativeAmount || '0')
        if (address && nativeAmount) outputs.push({ address, value })
        else if (script) outputs.push({ script, value })
      }

      const bcoinTx = await this.keyManager.createTX({
        outputs,
        utxos,
        rate,
        txOptions,
        height: this.getBlockHeight()
      })

      const { scriptHashes } = this.engineState
      const sumOfTx = spendTargets.reduce(
        (s, { publicAddress, nativeAmount }: EdgeSpendTarget) =>
          publicAddress && scriptHashes[publicAddress]
            ? s
            : s - parseInt(nativeAmount),
        0
      )

      const addresses = getReceiveAddresses(bcoinTx, this.network)

      const ourReceiveAddresses = addresses.filter(
        address => scriptHashes[address]
      )

      const edgeTransaction: EdgeTransaction = {
        ourReceiveAddresses,
        otherParams: {
          txJson: bcoinTx.getJSON(this.network),
          edgeSpendInfo,
          rate
        },
        currencyCode: this.currencyCode,
        txid: '',
        date: 0,
        blockHeight: 0,
        nativeAmount: `${sumOfTx - parseInt(bcoinTx.getFee())}`,
        networkFee: `${bcoinTx.getFee()}`,
        signedTx: ''
      }
      return edgeTransaction
    } catch (e) {
      if (e.type === 'FundingError') throw new Error('InsufficientFundsError')
      throw e
    }
  }

  async makeSigmaSpend (
    edgeSpendInfo: EdgeSpendInfo,
    txOptions?: TxOptions = {}
  ): Promise<EdgeTransaction> {
    const { spendTargets } = edgeSpendInfo
    // Can't spend without outputs
    if (!txOptions.CPFP && (!spendTargets || spendTargets.length < 1)) {
      throw new Error('Need to provide Spend Targets')
    }
    // Calculate the total amount to send
    const totalAmountToSend = spendTargets.reduce(
      (sum, { nativeAmount }) => bns.add(sum, nativeAmount || '0'),
      '0'
    )

    const mintData: PrivateCoin[] = await this.readPrivateCoins()
    logger.info('spend mintData = ', mintData)

    if (!this.currentMaxIndex) {
      this.currentMaxIndex = 0
    }

    const approvedMints: PrivateCoin[] = []
    mintData.forEach(info => {
      if (info.groupId && info.groupId !== -1 && !info.isSpend) {
        approvedMints.push(info)
      }
      this.currentMaxIndex = Math.max(this.currentMaxIndex, info.index)
    })

    logger.info('approvedMints to be spend', approvedMints)
    logger.info('currentMaxIndex to be spend', this.currentMaxIndex)

    // // Try and get UTXOs from `txOptions`, if unsuccessful use our own utxo's
    let { utxos = this.engineState.getUTXOs() } = txOptions
    utxos = JSON.parse(JSON.stringify(utxos))
    
    // // Test if we have enough to spend
    // if (bns.gt(totalAmountToSend, `${approvedMintedBalance}`)) {
    //   throw new InsufficientFundsError()
    // }

    let remainder = parseInt(totalAmountToSend || '0')
    logger.info('spend remainder before ', remainder)
    const mintsToBeSpend: PrivateCoin[] = this.getMintsToSpend(approvedMints, remainder)
    logger.info('mintsToBeSpend', mintsToBeSpend)
    if (mintsToBeSpend.length === 0) {
      return
    }

    const spendCoins: SpendCoin[] = []
    for (const info of mintsToBeSpend) {
      const retrievedData = await this.engineState.retrieveAnonymitySet(info.value, info.groupId)
      logger.info('retrieveAnonymitySet retrievedData', retrievedData)
      spendCoins.push({
        value: info.value,
        anonymitySet: retrievedData.serializedCoins,
        blockHash: retrievedData.blockHash,
        index: info.index,
        groupId: info.groupId
      })
    }
    logger.info('mints to be spend', mintsToBeSpend)

    try {
      // Get the rate according to the latest fee
      const rate = this.getRate(edgeSpendInfo)
      logger.info(`spend: Using fee rate ${rate} sat/K`)
      // Create outputs from spendTargets

      const mintBalance = parseInt(this.getBalance({ mintedBalance: true }), 10)

      for (let i = 0; i < utxos.length; i++) {
        const len = utxos[i].tx.outputs.length
        utxos[i].tx.outputs[len - 1].value = mintBalance
      }

      const outputs = []
      for (const spendTarget of spendTargets) {
        const {
          publicAddress: address,
          nativeAmount,
          otherParams: { script } = {}
        } = spendTarget
        const value = parseInt(nativeAmount || '0')
        if (address && nativeAmount) outputs.push({ address, value })
        else if (script) outputs.push({ script, value })
      }

      const { tx: bcoinTx, mints: mintedInTx, spendFee: spendFee } = await this.keyManager.createSpendTX({
        mints: spendCoins,
        outputs,
        rate,
        txOptions,
        utxos,
        height: this.getBlockHeight(),
        io: this.io,
        privateKey: this.walletInfo.keys.dataKey,
        currentIndex: this.currentMaxIndex
      })

      const { scriptHashes } = this.engineState
      const sumOfTx = spendTargets.reduce(
        (s, { publicAddress, nativeAmount }: EdgeSpendTarget) =>
          publicAddress && scriptHashes[publicAddress]
            ? s
            : s - parseInt(nativeAmount),
        0
      )

      const addresses = getReceiveAddresses(bcoinTx, this.network)

      const ourReceiveAddresses = addresses.filter(
        address => scriptHashes[address]
      )

      const edgeTransaction: EdgeTransaction = {
        ourReceiveAddresses,
        otherParams: {
          txJson: bcoinTx.getJSON(this.network),
          edgeSpendInfo,
          rate,
          isSpend: true,
          mintedInTx,
          spendCoins
        },
        currencyCode: this.currencyCode,
        txid: '',
        date: 0,
        blockHeight: 0,
        nativeAmount: `${sumOfTx}`,
        networkFee: `${spendFee}`,
        signedTx: ''
      }

      logger.info('spend 2', edgeTransaction)
      return edgeTransaction
    } catch (e) {
      if (e.type === 'FundingError') throw new Error('InsufficientFundsError')
      throw e
    }
  }

  async saveMintInfoFromSpendTx (mintedInTx: PrivateCoin[], spendCoins: PrivateCoin[], txId: string) {
    const promise = this.readPrivateCoins()
    const mints = await promise
    let spendValue = 0
    spendCoins.forEach(spended => {
      for (let i = 0; i < mints.length; ++i) {
        const mint = mints[i]
        if (mint.index === spended.index) {
          mint.isSpend = true
          mint.spendTxId = txId
          spendValue += mint.value
          break
        }
      }
    })
    this.savedSpendTransactionValues[txId] = spendValue
    const allMints = [...mints, ...mintedInTx]
    await this.writePrivateCoins(allMints)
  }

  async signTx (edgeTransaction: EdgeTransaction): Promise<EdgeTransaction> {
    const { edgeSpendInfo, txJson, isSpend } = edgeTransaction.otherParams || {}
    this.logEdgeTransaction(edgeTransaction, 'Signing')

    if (isSpend) {
      logger.info('spend&mint: spend transaction')
      const bTx = parseJsonTransactionForSpend(txJson)
      const signedTx = bTx.toRaw().toString('hex')

      return {
        ...edgeTransaction,
        signedTx,
        date: Date.now() / MILLI_TO_SEC
      }
    }

    logger.info('spend&mint: mint transaction')

    txJson.version = 1
    const bcoinTx = parseJsonTransaction(txJson)
    const { privateKeys = [], otherParams = {} } = edgeSpendInfo
    const { paymentProtocolInfo } = otherParams
    const { signedTx, txid } = await this.keyManager.sign(bcoinTx, privateKeys)
    if (paymentProtocolInfo) {
      const publicAddress = this.getFreshAddress().publicAddress
      const address = toLegacyFormat(publicAddress, this.network)
      const payment = createPayment(
        paymentProtocolInfo,
        address,
        signedTx,
        this.currencyCode
      )
      Object.assign(edgeTransaction.otherParams, {
        paymentProtocolInfo: { ...paymentProtocolInfo, payment }
      })
    }
    return {
      ...edgeTransaction,
      signedTx,
      txid,
      date: Date.now() / MILLI_TO_SEC
    }
  }

  async broadcastTx (
    edgeTransaction: EdgeTransaction
  ): Promise<EdgeTransaction> {
    const { otherParams = {}, signedTx, currencyCode } = edgeTransaction
    const { paymentProtocolInfo, isSpend = false, mintedInTx = [], spendCoins = [] } = otherParams

    if (isSpend) {
      this.saveMintInfoFromSpendTx(mintedInTx, spendCoins, otherParams.txJson.hash)
      edgeTransaction.txid = otherParams.txJson.hash
    }

    if (paymentProtocolInfo && paymentProtocolInfo.payment) {
      const paymentAck = await sendPayment(
        this.io.fetch,
        this.network,
        paymentProtocolInfo.paymentUrl,
        paymentProtocolInfo.payment
      )
      if (!paymentAck) {
        throw new Error(
          `Error when sending to ${paymentProtocolInfo.paymentUrl}`
        )
      }
    }

    const tx = verifyTxAmount(signedTx)
    if (!tx) throw new Error('Wrong spend amount')
    edgeTransaction.otherParams.txJson = tx.getJSON(this.network)
    this.logEdgeTransaction(edgeTransaction, 'Broadcasting')

    // Try APIs
    const promiseArray = []
    if (!this.pluginState.disableFetchingServers) {
      for (const broadcastFactory of broadcastFactories) {
        const broadcaster = broadcastFactory(this.io, currencyCode)
        if (broadcaster) promiseArray.push(broadcaster(signedTx))
      }
    }

    promiseArray.push(this.engineState.broadcastTx(signedTx))
    await promiseAny(promiseArray)
    return edgeTransaction
  }

  saveTx (edgeTransaction: EdgeTransaction): Promise<void> {
    this.logEdgeTransaction(edgeTransaction, 'Saving')
    this.engineState.saveTx(edgeTransaction.txid, edgeTransaction.signedTx)
    return Promise.resolve()
  }

  getDisplayPrivateSeed (): string | null {
    return this.keyManager ? this.keyManager.getSeed() : null
  }

  getDisplayPublicSeed (): string | null {
    return this.keyManager ? this.keyManager.getPublicSeed() : null
  }

  dumpData (): EdgeDataDump {
    return {
      walletId: this.walletId.split(' - ')[0],
      walletType: this.walletInfo.type,
      walletFormat: this.walletInfo.keys && this.walletInfo.keys.format,
      pluginType: this.pluginState.pluginName,
      fees: this.fees,
      data: {
        ...this.pluginState.dumpData(),
        ...this.engineState.dumpData()
      }
    }
  }

  async mintLoop () {
    const restored = await this.restore()
    if (!restored) {
      return
    }

    logger.info('mintLoop')
    const needToMint = this.getBalance()
    logger.info('Not minted balance: ' + needToMint)
    let needToMintNum = Number(needToMint)
    if (needToMintNum > 5000000) {
      if (needToMintNum % 5000000 === 0) {
        // can't mint all balance, because of fee
        needToMintNum -= 5000000
      }
      logger.info('Trying to mint: ' + needToMintNum)
      const edgeInfo: EdgeSpendInfo = {
        currencyCode: 'XZC',
        spendTargets: [
          {
            publicAddress: this.keyManager.getChangeAddress(),
            nativeAmount: '' + needToMintNum
          }
        ]
      }
      // mint and getMintMetadataLoop must not work paralelly in order to avoid problems related to modifying mint.json parallely
      await this.mint(edgeInfo)
    }

    await this.getMintMetadataLoop()
    if (!this.pendingSpendTransactionResync) {
      await this.refreshNeededSpendTransactions()
    }
  }

  async restore (): Promise<Boolean> {
    logger.info('restore')

    try {
      const restoreJsonStr = await this.walletLocalEncryptedDisklet.getText(RESTORE_FILE)
      logger.info('restore json', restoreJsonStr)
      if (restoreJsonStr && JSON.parse(restoreJsonStr).restored) {
        return true
      }
    } catch (e) {
    }

    const mintData: PrivateCoin[] = []

    const usedCoins = await this.engineState.retrieveUsedCoinSerials()
    const usedSerialNumbers = usedCoins.serials

    const latestCoinIds = await this.engineState.retrieveLatestCoinIds()
    let commitmentCount = 0
    for (let coinInfo of latestCoinIds) {
      coinInfo.anonymitySet = []
      for (let i = 0; i < coinInfo.id; i++) {
        const anonimitySet = await this.engineState.retrieveAnonymitySet(coinInfo.denom, i + 1)
        coinInfo.anonymitySet = coinInfo.anonymitySet.concat(anonimitySet.serializedCoins)
        commitmentCount += anonimitySet.serializedCoins.length
      }
    }

    logger.info('used serial numbers = ', usedSerialNumbers)
    logger.info('commitments = ', latestCoinIds)
    logger.info('commitments count = ', commitmentCount)

    let counter = 0
    let index = -1
    while (counter++ < 100 && index++ < commitmentCount) {
      const coin = await privateCoin(100000000, this.walletInfo.keys.dataKey, index, this.io)
      let isSpend = usedSerialNumbers.includes(coin.serialNumber)
      for (let coinInfo of latestCoinIds) {
        if (coinInfo.anonymitySet.includes(coin.commitment)) {
          mintData.push({
            value: coinInfo.denom,
            index: index,
            commitment: coin.commitment,
            groupId: -1,
            isSpend: isSpend,
            spendTxId: '' // TODO
          })
          counter = 0
          break
        }
      }
    }

    try {
      await this.writePrivateCoins(mintData)
      await this.walletLocalEncryptedDisklet.setText(RESTORE_FILE, JSON.stringify({restored: true}))
      logger.info('restored')
    } catch (e) {
      return false
    }

    return true
  }

  async getMintMetadataLoop () {
    logger.info('getMintMetadataLoop')

    // get saved mint data
    const mintData: PrivateCoin[] = await this.readPrivateCoins()

    // process mints
    const mintsToRetrieve = []
    const mintsToUpdate = {}
    mintData.forEach(info => {
      if (info.commitment) {
        mintsToRetrieve.push({ denom: info.value, pubcoin: info.commitment })
        mintsToUpdate[info.commitment] = info
      }
    })

    if (mintsToRetrieve.length > 0) {
      const retrievedData = await this.engineState.retrieveMintMetadata(mintsToRetrieve)
      logger.info('retrieveMintMetadata retrievedData', retrievedData)
      retrievedData.forEach(data => {
        mintsToUpdate[data.pubcoin].groupId = (this.getBlockHeight() - data.height >= 5 ? data.groupId : -1)
      })
      await this.writePrivateCoins(mintData)
    }
  }

  async addToLoop (func: string, timer: number) {
    try {
      // $FlowFixMe
      await this[func]()
    } catch (e) {
      logger.error('Error in Loop:', func, e)
    }
    if (this.engineOn) {
      this.timers[func] = setTimeout(() => {
        if (this.engineOn) {
          this.addToLoop(func, timer)
        }
      }, timer)
    }
    return true
  }

  async mint (edgeSpendInfo: EdgeSpendInfo) {
    let tx = null
    let promise = null
    let tryAgain = true
    while (tryAgain) {
      tryAgain = false
      try {
        promise = this.makeMint(edgeSpendInfo)
        tx = await promise
        logger.info('mint tx: makeMint ', tx)
      } catch (e) {
        logger.info('mint tx: Error ', e)
        if (e.message === 'InsufficientFundsError') {
          const amount = parseInt(edgeSpendInfo.spendTargets[0].nativeAmount || '0')
          if (amount > 5000000) {
            edgeSpendInfo.spendTargets[0].nativeAmount = '' + (amount - 5000000)
            logger.info('mint tx: Decreasing mint amount to have enough fee and try creating transaction again')
            tryAgain = true
          } else {
            return
          }
        } else {
          return
        }
      }
    }
    if (tx == null) {
      return
    }

    promise = this.signTx(tx)
    tx = await promise
    logger.info('mint tx: signTx ', tx)
    promise = this.broadcastTx(tx)
    tx = await promise

    logger.info('mint tx: broadcastTx ', tx)
  }

  async writePrivateCoins (mintData: PrivateCoin[]) {
    try {
      await this.walletLocalEncryptedDisklet.setText(SIGMA_ENCRYPTED_FILE, JSON.stringify(mintData))
      logger.info('mint - write private coins ', JSON.stringify(mintData))
    } catch (e) {
      // can't save mint data
      throw e
    }
  }

  async readPrivateCoins (): Promise<PrivateCoin[]> {
    let mintData: PrivateCoin[] = []
    try {
      const mintDataStr = await this.walletLocalEncryptedDisklet.getText(SIGMA_ENCRYPTED_FILE)
      logger.info('mint read private coins: ', mintDataStr)
      mintData = JSON.parse(mintDataStr)
    } catch (e) {
      // no minted coins yet
    }

    return mintData
  }

  async makeMint (
    edgeSpendInfo: EdgeSpendInfo,
    txOptions?: TxOptions = {}
  ): Promise<EdgeTransaction> {
    const { spendTargets } = edgeSpendInfo
    // Can't spend without outputs
    if (!txOptions.CPFP && (!spendTargets || spendTargets.length < 1)) {
      throw new Error('Need to provide Spend Targets')
    }
    // Calculate the total amount to send
    const totalAmountToSend = spendTargets.reduce(
      (sum, { nativeAmount }) => bns.add(sum, nativeAmount || '0'),
      '0'
    )

    // Try and get UTXOs from `txOptions`, if unsuccessful use our own utxo's
    const { utxos = this.engineState.getUTXOs() } = txOptions
    // Test if we have enough to spend
    if (bns.gt(totalAmountToSend, `${sumUtxos(utxos)}`)) {
      throw new InsufficientFundsError()
    }
    try {
      // Get the rate according to the latest fee
      const rate = this.getRate(edgeSpendInfo)
      logger.info(`spend: Using fee rate ${rate} sat/K`)
      // Create outputs from spendTargets

      const mintData: PrivateCoin[] = await this.readPrivateCoins()

      if (!this.currentMaxIndex) {
        this.currentMaxIndex = 0
      }
      mintData.forEach(data => { this.currentMaxIndex = Math.max(data.index, this.currentMaxIndex) })

      const outputs = []
      let mints = []
      for (const spendTarget of spendTargets) {
        const {
          publicAddress: address,
          nativeAmount,
          otherParams: { script } = {}
        } = spendTarget
        const balance = parseInt(nativeAmount || '0')

        mints = await getMintCommitmentsForValue(balance, this.walletInfo.keys.dataKey, this.currentMaxIndex, this.io)
        mints.forEach(coin => {
          if (address && nativeAmount) {
            outputs.push({ address, value: coin.value })
          } else if (script) {
            outputs.push({ script, value: coin.value })
          }
        })
        this.currentMaxIndex += mints.length
      }

      const bcoinTx = await this.keyManager.createTX({
        outputs,
        utxos,
        rate,
        txOptions,
        height: this.getBlockHeight(),
        io: this.io,
        walletInfo: this.walletInfo
      })

      for (let i = 0; i < outputs.length; i++) {
        const privateCoin = mints[i]
        mintData.push({
          value: privateCoin.value,
          index: privateCoin.index,
          commitment: privateCoin.commitment,
          groupId: -1,
          isSpend: false,
          spendTxId: ''
        })
        bcoinTx.outputs[i].address = null
        bcoinTx.outputs[i].script.fromRaw(Buffer.concat([Buffer.of(OP_SIGMA_MINT), Buffer.from(privateCoin.commitment, 'hex')]))
      }

      await this.writePrivateCoins(mintData)

      const { scriptHashes } = this.engineState
      const sumOfTx = spendTargets.reduce(
        (s, { publicAddress, nativeAmount }: EdgeSpendTarget) =>
          publicAddress && scriptHashes[publicAddress]
            ? s
            : s - parseInt(nativeAmount),
        0
      )

      const addresses = getReceiveAddresses(bcoinTx, this.network)

      const ourReceiveAddresses = addresses.filter(
        address => scriptHashes[address]
      )

      const edgeTransaction: EdgeTransaction = {
        ourReceiveAddresses,
        otherParams: {
          txJson: bcoinTx.getJSON(this.network),
          edgeSpendInfo,
          rate,
          isSpend: false
        },
        currencyCode: this.currencyCode,
        txid: '',
        date: 0,
        blockHeight: 0,
        nativeAmount: `${sumOfTx - parseInt(bcoinTx.getFee())}`,
        networkFee: `${bcoinTx.getFee()}`,
        signedTx: ''
      }
      return edgeTransaction
    } catch (e) {
      logger.error('mint tx: ', e)
      if (e.type === 'FundingError') throw new Error('InsufficientFundsError')
      throw e
    }
  }

  async refreshNeededSpendTransactions () {
    try {
      const mintDataStr = await this.walletLocalEncryptedDisklet.getText(SIGMA_ENCRYPTED_FILE)
      if (mintDataStr) {
        const mintData = JSON.parse(mintDataStr)
        let refreshNeeded = false
        mintData.forEach((item) => {
          const txid = item.spendTxId
          if (txid) {
            const { height = -1 } = this.engineState.txHeightCache[txid] || {}
            // not reload transaction if confirmations > 1
            if ((height <= 0 || this.getBlockHeight() - height <= 1) && !this.engineState.missingTxsVerbose[txid]) {
              this.engineState.handleNewTxid(txid, true)
              refreshNeeded = true
              logger.info(`Reloading transaction ${txid} because height is ${height}, last block height: ${this.getBlockHeight()}`)
            }
          }
        })
        if (refreshNeeded) {
          this.engineState.wakeUpConnections()
        }
      }
    }
    catch (e) {
      logger.info(`${this.walletId}: Failed to refresh needed spend transactions: ${e}`)
    }
  }

  forceReloadSpendTransactions () {
    // reload the spend transactions
    try {
      this.walletLocalEncryptedDisklet.getText(SIGMA_ENCRYPTED_FILE)
        .then(mintDataStr => {
          if (mintDataStr) {
            const mintData = JSON.parse(mintDataStr)
            mintData.forEach((item) => {
              if (item.spendTxId) {
                this.engineState.handleNewTxid(item.spendTxId, true)
              }
            })
          }
        })
    }
    catch (e) {
      logger.info(`${this.walletId}: Failed to reload spend transactions: ${e}`)
    }
  }

  // we will try to minimize sum of mints to use and new mints to be created
  getMintsToSpend (approvedMints: PrivateCoin[], spendValue: number) {
    // calculate required and max check values in count of min denom
    const minValueCoin = denominations[0]
    const minValueCoinsRequired = Math.ceil(spendValue / minValueCoin)
    const maxCheckValue = minValueCoinsRequired + denominations[denominations.length - 1] / minValueCoin

    // sort approved mints in value descending order and if value is same than sort in index descending order
    approvedMints.sort((c1, c2) => {
      if (c1.value != c2.value) {
        return c2.value - c1.value
      }

      return c2.index - c1.index
    })

    // knapsack algorithm two rows
    const bigNumber = 1000000000
    let prevRow = new Array(maxCheckValue + 1)
    let nextRow = new Array(maxCheckValue + 1)
    let mintIndexRow = new Array(maxCheckValue + 1)
    
    nextRow.fill(bigNumber)
    nextRow[0] = prevRow[0] = 0
    let currentMintIndex = approvedMints.length - 1
    if (currentMintIndex >= 0) {
      nextRow[approvedMints[currentMintIndex].value / minValueCoin] = 1
      mintIndexRow[approvedMints[currentMintIndex].value / minValueCoin] = currentMintIndex
      --currentMintIndex
    }

    // run knapsack algorithm and try to minimize total weight for each value: weight is 1 for all mints
    for (; currentMintIndex >= 0; --currentMintIndex) {
      //swap rows
      let temp = prevRow
      prevRow = nextRow
      nextRow = temp

      // get current value
      const currentValue = approvedMints[currentMintIndex].value / minValueCoin
      for (let j = 1; j <= maxCheckValue; ++j) {
        nextRow[j] = prevRow[j]
        if (j >= currentValue && nextRow[j] > prevRow[j - currentValue] + 1) {
          nextRow[j] = prevRow[j - currentValue] + 1
          mintIndexRow[j] = currentMintIndex
        }
      }
    }

    // find best spend value
    let bestSpendValue = maxCheckValue
    let index = maxCheckValue
    let currentMin = bigNumber
    while (index >= minValueCoinsRequired) {
      const newMin = nextRow[index] + this.getRequiredMintCountForValue((index - minValueCoinsRequired) * minValueCoin)
      if (currentMin > newMin && nextRow[index] != bigNumber) {
        bestSpendValue = index
        currentMin = newMin
      }
      --index
    }
    if (currentMin == bigNumber) {
      throw new InsufficientFundsError()
    }

    // fill mints to spend
    const mintsToBeSpend: PrivateCoin[] = []
    while (bestSpendValue > 0) {
      const mintToSpend = approvedMints[mintIndexRow[bestSpendValue]]
      mintsToBeSpend.push(mintToSpend)
      bestSpendValue -= mintToSpend.value / minValueCoin
    }
    return mintsToBeSpend
  }

  getRequiredMintCountForValue (value: number) {
    let result = 0
    for (let i = denominations.length - 1; i >= 0; --i) {
      while (value >= denominations[i]) {
        value -= denominations[i]
        result++
      }
    }

    return result
  }
}
