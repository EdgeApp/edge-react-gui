import { add, eq, gt, gte, max, mul, sub } from 'biggystring'
import {
  EdgeAddress,
  EdgeCurrencyEngine,
  EdgeCurrencyEngineOptions,
  EdgeEnginePrivateKeyOptions,
  EdgeMemo,
  EdgeMetadata,
  EdgeSpendInfo,
  EdgeTransaction,
  EdgeWalletInfo,
  InsufficientFundsError,
  JsonObject,
  NoAmountSpecifiedError
} from 'edge-core-js/types'
import type {
  CreateTransferOpts,
  SpendFailure,
  SpendSuccess,
  StatusEvent,
  Transaction
} from 'react-native-zcash'
import { base16, base64 } from 'rfc4648'

import { CurrencyEngine } from '../common/CurrencyEngine'
import { PluginEnvironment } from '../common/innerPlugin'
import { cleanTxLogs, getOtherParams } from '../common/utils'
import type { ZcashIo, ZcashSynchronizer } from './zcashIo'
import { isIronwoodMigrationSpend, mapMigrationStatus } from './zcashMigration'
import { makeZcashSyncTracker, ZcashSyncTracker } from './ZcashSyncTracker'
import { ZcashTools } from './ZcashTools'
import {
  asSafeZcashWalletInfo,
  asZcashPrivateKeys,
  asZcashWalletOtherData,
  SafeZcashWalletInfo,
  ZcashBalances,
  ZcashMigrationStatus,
  ZcashNetworkInfo,
  ZcashWalletOtherData
} from './zcashTypes'
import { computeAvailableZatoshi } from './zcashUtils'

export class ZcashEngine extends CurrencyEngine<
  ZcashTools,
  SafeZcashWalletInfo,
  ZcashSyncTracker
> {
  pluginId: string
  networkInfo: ZcashNetworkInfo
  otherData!: ZcashWalletOtherData
  synchronizerStatus!: StatusEvent['name']
  availableZatoshi!: string
  balances: ZcashBalances

  makeSynchronizer: ZcashIo['makeSynchronizer']

  // Synchronizer management
  stopSyncing?: (value: number | PromiseLike<number>) => void
  synchronizer?: ZcashSynchronizer
  synchronizerPromise: Promise<ZcashSynchronizer>
  synchronizerResolver!: (synchronizer: ZcashSynchronizer) => void
  /**
   * True for the span of `resyncBlockchain`, from before it tears the engine
   * down until the rewind has happened. While set, progress reports describe
   * the wallet the resync is discarding and must not reach the sync tracker,
   * whose don't-go-backwards ratchet would otherwise hold that pre-rewind
   * ratio - 1 for a wallet that was synced, or its last position for one that
   * was still syncing - for the whole rescan.
   */
  rescanSettling = false
  autoshielding: {
    createAutoshieldTx: boolean
    threshold: string
    txid?: string
  }

  /**
   * The NU6.3 activation height, fetched once per engine life from the
   * native side. undefined = not yet fetched; null = unknown/unsupported
   * (pre-Ironwood native build, or the Android stubs) — migration detection
   * stays dormant then.
   */
  ironwoodActivationHeight?: number | null

  otherMethods: Object

  constructor(
    env: PluginEnvironment<ZcashNetworkInfo>,
    tools: ZcashTools,
    walletInfo: SafeZcashWalletInfo,
    opts: EdgeCurrencyEngineOptions,
    makeSynchronizer: ZcashIo['makeSynchronizer']
  ) {
    super(env, tools, walletInfo, opts, makeZcashSyncTracker)
    const { networkInfo } = env
    this.pluginId = this.currencyInfo.pluginId
    this.networkInfo = networkInfo
    this.makeSynchronizer = makeSynchronizer
    this.synchronizerPromise = new Promise<ZcashSynchronizer>(resolve => {
      this.synchronizerResolver = resolve
    })
    this.balances = {
      transparentAvailableZatoshi: '0',
      transparentTotalZatoshi: '0',
      saplingAvailableZatoshi: '0',
      saplingTotalZatoshi: '0',
      orchardAvailableZatoshi: '0',
      orchardTotalZatoshi: '0',
      ironwoodAvailableZatoshi: '0',
      ironwoodTotalZatoshi: '0'
    }
    this.autoshielding = {
      createAutoshieldTx: false,
      threshold: mul(this.networkInfo.defaultNetworkFee, '2') // Only autoshield if received shielded balance is greater than the default fee
    }

    this.otherMethods = {
      /**
       * Pull-based Orchard -> Ironwood migration status for the GUI (poll on
       * scene focus). Safe to call any time; reports notNeeded until the
       * wallet syncs and NU6.3 activates.
       *
       * `remainingOrchardZatoshi` is the Orchard-pool balance the GUI must
       * show at the migration entry point (ZIP 318). The sweep it offers on
       * 'required' runs through the regular send scene, but as an
       * Orchard-ONLY proposal (see makeSpend) so no other pool is dragged
       * across the turnstile.
       */
      getMigrationStatus: async (): Promise<ZcashMigrationStatus> => {
        const dormant: ZcashMigrationStatus = {
          state: 'notNeeded',
          completedTransfers: 0,
          totalTransfers: 0,
          remainingOrchardZatoshi: this.balances.orchardAvailableZatoshi,
          hasOverdueTransfers: false,
          isSynced: this.isSynced(),
          nextTransferReadyAtHeight: undefined
        }
        const synchronizer = this.synchronizer
        if (synchronizer == null || !this.isSynced()) return dormant

        if (this.ironwoodActivationHeight === undefined) {
          try {
            this.ironwoodActivationHeight =
              await this.tools.nativeTools.getIronwoodActivationHeight(
                this.networkInfo.rpcNode.networkName
              )
          } catch (e) {
            // Pre-Ironwood native builds and the Android stubs reject; treat
            // as unknown so detection stays dormant instead of failing polls:
            this.ironwoodActivationHeight = null
          }
        }
        return mapMigrationStatus({
          isSynced: true,
          orchardAvailableZatoshi: this.balances.orchardAvailableZatoshi,
          networkBlockHeight: this.walletLocalData.blockHeight,
          activationHeight: this.ironwoodActivationHeight
        })
      }
    }
  }

  setOtherData(raw: any): void {
    this.otherData = asZcashWalletOtherData(raw)
  }

  initData(): void {
    // walletLocalData
    this.otherData.isSdkInitializedOnDisk = true
    this.walletLocalDataDirty = true

    // Engine variables
    this.synchronizerStatus = 'DISCONNECTED'
    this.availableZatoshi = '0'
  }

  initSubscriptions(): void {
    if (this.synchronizer == null) return
    this.synchronizer.on('update', async payload => {
      const { scanProgress, networkBlockHeight } = payload
      this.updateBlockHeight(networkBlockHeight)

      // The synchronizer is left running across a resync, so progress sampled
      // before the rewind can be delivered after it. Every such report
      // describes the wallet the rewind is about to discard, and the tracker
      // both trusts a first-seen 100 and never goes backwards, so letting one
      // through pins the ratio for the rest of the rescan - at 1 for a stale
      // 100, or at whatever the wallet had reached if it was still syncing
      // when the resync was requested. Ignore all of them; the flag is cleared
      // once the rewind has actually happened (see resyncBlockchain).
      if (this.rescanSettling) return

      this.syncTracker.updateProgress(scanProgress)
      await this.checkAutoshielding()
    })
    this.synchronizer.on('statusChanged', async payload => {
      this.synchronizerStatus = payload.name
    })
    this.synchronizer.on('balanceChanged', async payload => {
      const {
        transparentAvailableZatoshi,
        transparentTotalZatoshi,
        saplingAvailableZatoshi,
        saplingTotalZatoshi,
        orchardAvailableZatoshi,
        orchardTotalZatoshi,
        ironwoodAvailableZatoshi,
        ironwoodTotalZatoshi
      } = payload

      this.balances = {
        transparentAvailableZatoshi,
        transparentTotalZatoshi,
        saplingAvailableZatoshi,
        saplingTotalZatoshi,
        orchardAvailableZatoshi,
        orchardTotalZatoshi,
        ironwoodAvailableZatoshi,
        ironwoodTotalZatoshi
      }
      // Transparent funds will be autoshielded so the available balance should only reflect the shielded balances
      this.availableZatoshi = computeAvailableZatoshi(this.balances)

      const total = add(
        add(
          add(transparentTotalZatoshi, saplingTotalZatoshi),
          orchardTotalZatoshi
        ),
        ironwoodTotalZatoshi
      )

      this.updateBalance(null, total)
      await this.checkAutoshielding()
    })
    this.synchronizer.on('transactionsChanged', async payload => {
      const { transactions } = payload
      transactions.forEach(tx => {
        // Check if the autoshielding transaction has confirmed
        if (
          tx.rawTransactionId === this.autoshielding.txid &&
          tx.minedHeight > 0
        ) {
          this.autoshielding.txid = undefined
          this.autoshielding.createAutoshieldTx = false
        }

        this.processTransaction(tx)
      })
      this.sendTransactionEvents()
    })
    this.synchronizer.on('error', async payload => {
      this.log.warn(`Synchronizer error: ${payload.message}`)
      if (payload.level === 'critical') {
        await this.killEngine()
        await this.startEngine()
      }
    })
  }

  // This is a partial fix for handling unconfirmed txs in the seenTxCheckpoint API. It solves the problem for a single device, but multi-devices syncing the same account may still see incorrect notifications.
  isTransactionNew(edgeTransaction: EdgeTransaction): boolean {
    if (
      edgeTransaction.blockHeight === 0 &&
      edgeTransaction.confirmations === 'unconfirmed' &&
      this.seenTxCheckpoint != null &&
      !edgeTransaction.isSend
    ) {
      return true
    }
    return super.isTransactionNew(edgeTransaction)
  }

  isSynced(): boolean {
    // Synchronizer status is updated regularly and should be checked before accessing the db to avoid errors
    return this.synchronizerStatus === 'SYNCED'
  }

  processTransaction(tx: Transaction): void {
    const {
      rawTransactionId,
      raw,
      blockTimeInSeconds,
      minedHeight,
      value,
      fee,
      toAddress,
      isShielding,
      isExpired,
      memos
    } = tx
    let netNativeAmount = value
    const networkFee = fee ?? this.networkInfo.defaultNetworkFee
    if (toAddress != null) {
      // check if tx is a spend
      netNativeAmount = `-${add(netNativeAmount, networkFee)}`
    }

    const edgeMemos: EdgeMemo[] = memos
      .filter(text => text !== '')
      .map(text => ({
        memoName: 'memo',
        type: 'text',
        value: text
      }))

    // Special case for shielding txs
    let metadata: EdgeMetadata | undefined
    if (isShielding) {
      metadata = { notes: 'Shielding' }
      netNativeAmount = `-${networkFee}`
    }

    let confirmations: EdgeTransaction['confirmations'] | undefined
    if (isExpired) {
      confirmations = 'failed'
    }

    // The only pending transactions emitted from the sdk are the ones we create and it's possible
    // to see them through the 'transactionsChanged' listener before the synchronizer's sendToAddress
    // or shieldFunds resolves. In this case, we'll add the current time as the transaction date.
    const date =
      minedHeight === 0
        ? Math.max(blockTimeInSeconds, Date.now() / 1000)
        : blockTimeInSeconds

    // For outgoing transactions, carry the recipient address onto
    // `spendTargets` so the GUI can drive reverse address lookups (e.g. ZNS).
    // Shielded receives leave `toAddress` null, so no spendTargets there.
    const spendTargets =
      toAddress != null
        ? [
            {
              currencyCode: this.currencyInfo.currencyCode,
              nativeAmount: value,
              publicAddress: toAddress,
              memo: undefined,
              uniqueIdentifier: undefined
            }
          ]
        : undefined

    const edgeTransaction: EdgeTransaction = {
      blockHeight: minedHeight,
      confirmations,
      currencyCode: this.currencyInfo.currencyCode,
      date,
      isSend: netNativeAmount.startsWith('-'),
      memos: edgeMemos,
      metadata,
      nativeAmount: netNativeAmount,
      networkFee,
      networkFees: [],
      otherParams: {},
      ourReceiveAddresses: [], // Not accessible from SDK and unified addresses are deterministic
      signedTx: raw ?? '',
      spendTargets,
      tokenId: null,
      txid: rawTransactionId,
      walletId: this.walletId
    }
    this.addTransaction(null, edgeTransaction)
  }

  async checkAutoshielding(): Promise<void> {
    if (
      this.isSynced() &&
      !this.autoshielding.createAutoshieldTx &&
      gt(
        this.balances.transparentAvailableZatoshi,
        this.autoshielding.threshold
      )
    ) {
      this.autoshielding.createAutoshieldTx = true
      await this.restartSyncNetwork()
    }
  }

  async syncNetwork(opts: EdgeEnginePrivateKeyOptions): Promise<number> {
    if (!this.engineOn) return 1000

    const zcashPrivateKeys = asZcashPrivateKeys(this.currencyInfo.pluginId)(
      opts?.privateKeys
    )

    if (this.synchronizer == null) {
      const { rpcNode } = this.networkInfo

      // Replace this.synchronizerPromise with a fresh promise. The old promise might have already been resolved
      this.synchronizerPromise = this.makeSynchronizer({
        mnemonicSeed: zcashPrivateKeys.mnemonic,
        birthdayHeight: zcashPrivateKeys.birthdayHeight,
        alias: base16.stringify(base64.parse(this.walletId)),
        newWallet: !this.otherData.isSdkInitializedOnDisk,
        ...rpcNode
      })
      this.synchronizer = await this.synchronizerPromise
      // People might be waiting on the old promise, so resolve that
      this.synchronizerResolver(this.synchronizer)
      this.initData()
      this.initSubscriptions()
    }

    if (this.synchronizer != null && this.autoshielding.createAutoshieldTx) {
      return await new Promise(resolve => {
        this.log.warn('Autoshield transaction broadcasting...')
        this.synchronizer
          ?.shieldFunds({
            seed: zcashPrivateKeys.mnemonic,
            memo: '',
            threshold: this.autoshielding.threshold
          })
          .then(txid => {
            this.log.warn('Autoshield success', txid)
            this.autoshielding.txid = txid
          })
          .catch(e => {
            this.autoshielding.createAutoshieldTx = false
            this.log.error('Autoshield failed: ', e)
          })
          .finally(() => {
            this.stopSyncing = resolve
          })
      })
    }

    return await new Promise(resolve => {
      this.stopSyncing = resolve
    })
  }

  async killEngine(): Promise<void> {
    this.synchronizerPromise = new Promise<ZcashSynchronizer>(resolve => {
      this.synchronizerResolver = resolve
    })
    await super.killEngine()
    await this.restartSyncNetwork()
    await this.synchronizer?.stop()
    this.synchronizer = undefined
  }

  async restartSyncNetwork(): Promise<void> {
    if (this.stopSyncing != null) {
      await this.stopSyncing(1000)
      this.stopSyncing = undefined
    }
  }

  async clearBlockchainCache(): Promise<void> {
    await super.clearBlockchainCache()
  }

  async resyncBlockchain(): Promise<void> {
    // Ignore progress reports until the rewind has actually happened. The
    // synchronizer is deliberately left running across a resync and every call
    // below awaits, so anything it reports in the meantime describes the wallet
    // this resync is discarding (see initSubscriptions). The window is bounded
    // by this method rather than by the reports themselves: a stale report is
    // indistinguishable from a fresh one - a wallet that was still syncing when
    // the resync was requested emits sub-100 progress that looks exactly like
    // early rescan progress - and a status transition cannot bound it either,
    // since iOS suppresses the synchronizer's post-rescan SYNCED entirely.
    this.rescanSettling = true
    try {
      // Don't bother stopping and restarting the synchronizer for a resync
      await super.killEngine()
      await this.clearBlockchainCache()
      await this.startEngine()
      try {
        await this.synchronizer?.rescan()
      } catch (e: any) {
        this.warn('resyncBlockchain failed: ', e)
      }
    } finally {
      // Unconditionally, including the paths that never reach the rewind: a
      // throw from the calls above, or no synchronizer to rescan. Leaving this
      // armed would swallow every report for the rest of the session.
      this.rescanSettling = false
    }
    this.initData()
    this.synchronizerStatus = 'SYNCING'
  }

  async getMaxSpendable(edgeSpendInfo: EdgeSpendInfo): Promise<string> {
    // Orchard -> Ironwood sweep: the SDK's Orchard-only send-max defines the
    // amount, not the wallet's whole spendable balance (which would also drag
    // Sapling funds across the turnstile). Deterministic, so the amount quoted
    // here is the amount makeSpend proposes and the user signs.
    if (isIronwoodMigrationSpend(edgeSpendInfo)) {
      const synchronizer = await this.synchronizerPromise
      const { amountZatoshi } =
        await synchronizer.proposeOrchardToIronwoodMigration()
      return amountZatoshi
    }

    const { memos = [], spendTargets } = edgeSpendInfo
    const { publicAddress } = spendTargets[0]

    if (publicAddress == null) {
      throw new Error('makeSpend Missing publicAddress')
    }
    const synchronizer = await this.synchronizerPromise
    try {
      // We anticipate this to fail and return an error message we cna parse the spendable amount from
      await synchronizer.proposeTransfer({
        toAddress: publicAddress,
        zatoshi: this.availableZatoshi,
        memo: memos[0]?.value ?? ''
      })
    } catch (e) {
      const networkFee = extractFeeFromProposeTransferErrorString(String(e))
      return max(sub(this.availableZatoshi, networkFee), '0')
    }
    return this.availableZatoshi
  }

  async makeSpend(edgeSpendInfoIn: EdgeSpendInfo): Promise<EdgeTransaction> {
    const { edgeSpendInfo, currencyCode } = this.makeSpendCheck(edgeSpendInfoIn)
    const { memos = [], tokenId } = edgeSpendInfo
    const spendTarget = edgeSpendInfo.spendTargets[0]
    const { publicAddress, nativeAmount } = spendTarget

    if (publicAddress == null)
      throw new Error('makeSpend Missing publicAddress')
    if (nativeAmount == null) throw new NoAmountSpecifiedError()

    if (gte(nativeAmount, this.availableZatoshi)) {
      throw new InsufficientFundsError({ tokenId })
    }

    if (eq(nativeAmount, '0')) throw new NoAmountSpecifiedError()

    const synchronizer = await this.synchronizerPromise

    // Orchard -> Ironwood sweep: amount and fee come from the SDK's
    // Orchard-only proposal rather than the caller, so what the user signs is
    // exactly the Orchard-pool balance minus fee. Re-proposing is
    // deterministic, so this matches the getMaxSpendable quote the GUI locked.
    if (isIronwoodMigrationSpend(edgeSpendInfo)) {
      const immediate = await synchronizer.proposeOrchardToIronwoodMigration()
      return {
        blockHeight: 0,
        currencyCode,
        date: 0,
        isSend: true,
        memos,
        // Fee-only, like shielding (see processTransaction): the sweep moves
        // value between pools of this same wallet, so only the fee leaves it.
        // Debiting amount + fee would report the whole Orchard balance as gone.
        // The amount the user consents to is shown from the spend target, not
        // from here, so this does not soften the ZIP 315 disclosure.
        nativeAmount: mul(immediate.feeZatoshi, '-1'),
        networkFee: immediate.feeZatoshi,
        networkFees: [],
        otherParams: {
          proposalBase64: immediate.proposalBase64,
          ironwoodMigration: true
        },
        ourReceiveAddresses: [],
        signedTx: '',
        tokenId,
        txid: '',
        walletId: this.walletId
      }
    }

    // If a ZIP-321 Payment URI is provided, use that flow instead:
    const zip321Uri: string | undefined = (edgeSpendInfo.otherParams as any)
      ?.zip321Uri
    if (zip321Uri != null) {
      this.log(`[ZEC propose] zip321Uri ${zip321Uri}`)
    }

    const proposal =
      zip321Uri != null
        ? await synchronizer.proposeFulfillingPaymentURI(zip321Uri)
        : await synchronizer.proposeTransfer({
            toAddress: publicAddress,
            zatoshi: nativeAmount,
            memo: memos[0]?.value ?? ''
          })

    const networkFee = proposal.totalFee
    this.log(
      '[ZEC propose] proposal result ' + JSON.stringify(proposal, null, 2)
    )

    const totalTxAmount = add(nativeAmount, networkFee)

    if (gt(totalTxAmount, this.availableZatoshi)) {
      throw new InsufficientFundsError({ tokenId })
    }

    // **********************************
    // Create the unsigned EdgeTransaction

    const txNativeAmount = mul(totalTxAmount, '-1')

    const edgeTransaction: EdgeTransaction = {
      blockHeight: 0,
      currencyCode,
      date: 0,
      isSend: true,
      memos,
      nativeAmount: txNativeAmount,
      networkFee,
      networkFees: [],
      otherParams: {
        proposalBase64: proposal.proposalBase64
      },
      ourReceiveAddresses: [],
      signedTx: '',
      tokenId,
      txid: '',
      walletId: this.walletId
    }

    return edgeTransaction
  }

  async signTx(
    edgeTransaction: EdgeTransaction,
    privateKeys: JsonObject
  ): Promise<EdgeTransaction> {
    const { proposalBase64, ironwoodMigration } =
      getOtherParams(edgeTransaction)
    // Ironwood migration stays fused in broadcastTx: zingolib's
    // quick_immediate_migration has no stored-proposal sign/broadcast split.
    if (ironwoodMigration === true) {
      return edgeTransaction
    }
    if (proposalBase64 == null) {
      throw new Error('Missing proposalBase64 from makeSpend')
    }
    const zcashPrivateKeys = asZcashPrivateKeys(this.pluginId)(privateKeys)
    const txParams: CreateTransferOpts = {
      proposalBase64,
      mnemonicSeed: zcashPrivateKeys.mnemonic
    }
    const synchronizer = await this.synchronizerPromise
    const result = requireSpendSuccess(
      await synchronizer.createTransfer(txParams)
    )
    edgeTransaction.txid = result.txId
    edgeTransaction.signedTx = result.raw
    return edgeTransaction
  }

  async broadcastTx(
    edgeTransaction: EdgeTransaction,
    opts?: EdgeEnginePrivateKeyOptions
  ): Promise<EdgeTransaction> {
    const { proposalBase64, ironwoodMigration } =
      getOtherParams(edgeTransaction)

    try {
      const synchronizer = await this.synchronizerPromise
      if (ironwoodMigration === true) {
        if (proposalBase64 == null) {
          throw new Error('Missing proposalBase64 from makeSpend')
        }
        const zcashPrivateKeys = asZcashPrivateKeys(this.pluginId)(
          opts?.privateKeys
        )
        const result = requireSpendSuccess(
          await synchronizer.createTransfer({
            proposalBase64,
            mnemonicSeed: zcashPrivateKeys.mnemonic
          })
        )
        edgeTransaction.txid = result.txId
      } else {
        if (edgeTransaction.txid === '' || edgeTransaction.signedTx === '') {
          throw new Error(
            'Invalid transaction: missing signed transaction data'
          )
        }
        await synchronizer.broadcastTransfer(edgeTransaction.txid)
      }
      edgeTransaction.date = Date.now() / 1000

      this.warn(`SUCCESS broadcastTx\n${cleanTxLogs(edgeTransaction)}`)
    } catch (e: any) {
      this.warn('FAILURE broadcastTx failed: ', e)
      throw e
    }
    return edgeTransaction
  }

  async getAddresses(): Promise<EdgeAddress[]> {
    const getSynchronizerAddresses = async (): Promise<EdgeAddress[]> => {
      const synchronizer = await this.synchronizerPromise
      const { saplingAddress, transparentAddress, unifiedAddress } =
        await synchronizer.deriveUnifiedAddress()
      const addresses: EdgeAddress[] = [
        {
          addressType: 'unifiedAddress',
          publicAddress: unifiedAddress
        },
        {
          addressType: 'saplingAddress',
          publicAddress: saplingAddress
        },
        {
          addressType: 'transparentAddress',
          publicAddress: transparentAddress
        }
      ]

      this.otherData.cachedAddresses = addresses
      this.walletLocalDataDirty = true

      return addresses
    }

    if (this.otherData.cachedAddresses == null) {
      return await getSynchronizerAddresses()
    } else {
      getSynchronizerAddresses().catch(e => {
        throw e
      })
      return this.otherData.cachedAddresses
    }
  }
}

export async function makeCurrencyEngine(
  env: PluginEnvironment<ZcashNetworkInfo>,
  tools: ZcashTools,
  walletInfo: EdgeWalletInfo,
  opts: EdgeCurrencyEngineOptions
): Promise<EdgeCurrencyEngine> {
  const safeWalletInfo = asSafeZcashWalletInfo(walletInfo)
  const zcashIo =
    (env.nativeIo.zcash as ZcashIo) ??
    env.nativeIo['edge-currency-accountbased']?.zcash
  if (zcashIo == null) {
    throw new Error('Need zcash native IO')
  }

  const engine = new ZcashEngine(
    env,
    tools,
    safeWalletInfo,
    opts,
    zcashIo.makeSynchronizer
  )

  // Do any async initialization necessary for the engine
  await engine.loadEngine()

  return engine
}

/**
 * Parses error thrown from proposeTransfer and extracts spendable amount and fee
 * Example:	"Error while sending funds: Insufficient balance (have 780000, need 790000 including fee)"
 */
const extractFeeFromProposeTransferErrorString = (str: string): string => {
  const regex = /(\d+)/g
  const matches = str.match(regex)

  if (matches == null || matches.length !== 2) {
    throw new Error('Error parsing proposeTransfer error string')
  }
  const balance = parseInt(matches[0]).toString()
  const fee = sub(parseInt(matches[1]).toString(), balance)
  return fee
}

function requireSpendSuccess(
  result: SpendSuccess | SpendFailure
): SpendSuccess {
  if ('txId' in result && result.txId !== '') {
    return result
  }
  const message =
    'errorMessage' in result && result.errorMessage != null
      ? result.errorMessage
      : 'createTransfer failed'
  throw new Error(message)
}
