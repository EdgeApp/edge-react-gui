import { add, lt, mul } from 'biggystring'
import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import {
  EdgeCurrencyCodeOptions,
  EdgeCurrencyEngine,
  EdgeCurrencyEngineCallbacks,
  EdgeCurrencyEngineOptions,
  EdgeCurrencyInfo,
  EdgeCurrencyPlugin,
  EdgeCurrencyTools,
  EdgeDataDump,
  EdgeFreshAddress,
  EdgeGetTransactionsOptions,
  EdgeParsedUri,
  EdgeSpendInfo,
  EdgeStakingStatus,
  EdgeToken,
  EdgeTransaction,
  EdgeWalletInfo,
  InsufficientFundsError,
  JsonObject
} from 'edge-core-js'

import { matchJson } from '../matchJson'

interface State {
  customFeeSettings?: string[]
  balances: { [currencyCode: string]: string }
  stakedBalance: number
  blockHeight: number
  progress: number
  txs: { [txid: string]: EdgeTransaction }
}

const asFakeSettings = asObject({
  customFeeSettings: asOptional(asArray(asString)),
  balances: asObject(asString),
  publicAddress: asString,
  networkFee: asString,
  parentNetworkFee: asString
})

export type FakeSettings = ReturnType<typeof asFakeSettings>

const asState = asObject({
  balances: asOptional(asObject(asString)),
  stakedBalance: asOptional(asNumber),
  blockHeight: asOptional(asNumber),
  progress: asOptional(asNumber),
  txs: asOptional(asObject((raw: any) => raw))
})

const defaultTx = {
  blockHeight: 0,
  date: 1231006505000,
  nativeAmount: '0',
  networkFee: '0',
  ourReceiveAddresses: []
}

/**
 * Currency plugin transaction engine.
 */
class FakeCurrencyEngine {
  callbacks: EdgeCurrencyEngineCallbacks
  running: boolean
  state: State
  currencyInfo: EdgeCurrencyInfo
  enabledTokens: string[]
  enabledTokensMap: { [currencyCode: string]: boolean }
  defaultSettings: FakeSettings

  constructor(walletInfo: EdgeWalletInfo, currencyInfo: EdgeCurrencyInfo, opts: EdgeCurrencyEngineOptions) {
    this.callbacks = opts.callbacks
    this.running = false
    this.currencyInfo = currencyInfo
    this.defaultSettings = asFakeSettings(this.currencyInfo.defaultSettings)
    this.state = {
      customFeeSettings: [],
      balances: {},
      stakedBalance: 0,
      blockHeight: 0,
      progress: 0,
      txs: {}
    }
    this.enabledTokens = currencyInfo.metaTokens.map(token => token.currencyCode)
    this.enabledTokensMap = this.enabledTokens.reduce((prev, token) => {
      return { ...prev, [token]: true }
    }, {})

    // Fire initial callbacks:
    this._updateState({
      ...this.state,
      balances: this.defaultSettings.balances
    })
  }

  private _updateState(settings: Partial<State>): void {
    const state = this.state
    const {
      onAddressesChecked = () => {},
      onBalanceChanged = () => {},
      onBlockHeightChanged = () => {},
      onStakingStatusChanged = () => {},
      onTransactionsChanged = () => {}
    } = this.callbacks

    // Address callback:
    if (settings.progress != null) {
      state.progress = settings.progress
      onAddressesChecked(state.progress)
    }

    // Balance callback:
    if (settings.balances != null) {
      // Convert exchange amounts to native amounts
      const balances = Object.entries(settings.balances).reduce((prev, [currencyCode, balance]) => {
        if (currencyCode === this.currencyInfo.currencyCode) {
          const nativeBalance = mul(balance, this.currencyInfo.denominations[0].multiplier)
          return { ...prev, [currencyCode]: nativeBalance }
        }

        const metaToken = this.currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)
        if (metaToken == null) throw new Error(`Invalid token ${currencyCode}`)
        const nativeBalance = mul(balance, metaToken.denominations[0].multiplier)
        return { ...prev, [currencyCode]: nativeBalance }
      }, {})
      state.balances = balances

      Object.keys(state.balances).forEach(key => {
        onBalanceChanged(key, state.balances[key] ?? '0')
      })
    }

    // Staking status callback:
    if (settings.stakedBalance != null) {
      state.stakedBalance = settings.stakedBalance
      onStakingStatusChanged({
        stakedAmounts: [{ nativeAmount: String(state.stakedBalance) }]
      })
    }

    // Block height callback:
    if (settings.blockHeight != null) {
      state.blockHeight = settings.blockHeight
      onBlockHeightChanged(state.blockHeight)
    }

    // Transactions callback:
    if (settings.txs != null) {
      const changes: EdgeTransaction[] = []
      for (const txid of Object.keys(settings.txs)) {
        const newTx: EdgeTransaction = {
          ...defaultTx,
          ...settings.txs[txid],
          txid
        }
        const oldTx = state.txs[txid]

        if (oldTx == null || !matchJson(oldTx, newTx)) {
          changes.push(newTx)
          state.txs[txid] = newTx
        }
      }

      if (changes.length > 0) onTransactionsChanged(changes)
    }
  }

  async changeUserSettings(settings: JsonObject): Promise<void> {
    await this._updateState(asState(settings))
  }

  // Keys:
  getDisplayPrivateSeed(): string | null {
    return 'xpriv'
  }

  getDisplayPublicSeed(): string | null {
    return 'xpub'
  }

  // Engine state
  async startEngine(): Promise<void> {
    this.running = true
  }

  async killEngine(): Promise<void> {
    this.running = false
  }

  async resyncBlockchain(): Promise<void> {}

  async dumpData(): Promise<EdgeDataDump> {
    return {
      walletId: 'xxx',
      walletType: this.currencyInfo.walletType,
      data: { fakeEngine: { running: this.running } }
    }
  }

  // Chain state
  getBlockHeight(): number {
    return this.state.blockHeight
  }

  getBalance(opts: EdgeCurrencyCodeOptions): string {
    const { currencyCode = this.currencyInfo.currencyCode } = opts
    const balance = this.state.balances[currencyCode]
    if (balance == null) {
      throw new Error('Unknown currency')
    } else {
      return balance
    }
  }

  getNumTransactions(opts: EdgeCurrencyCodeOptions): number {
    return Object.keys(this.state.txs).length
  }

  async getTransactions(opts: EdgeGetTransactionsOptions): Promise<EdgeTransaction[]> {
    return Object.keys(this.state.txs).map(txid => this.state.txs[txid])
  }

  // Tokens
  async enableTokens(tokens: string[]): Promise<void> {}

  async disableTokens(tokens: string[]): Promise<void> {}

  async getEnabledTokens(): Promise<string[]> {
    return this.enabledTokens
  }

  async addCustomToken(token: EdgeToken): Promise<void> {}

  getTokenStatus(token: string): boolean {
    return this.enabledTokensMap[token] ?? false
  }

  // Staking:
  async getStakingStatus(): Promise<EdgeStakingStatus> {
    return {
      stakedAmounts: [{ nativeAmount: String(this.state.stakedBalance) }]
    }
  }

  // Addresses:
  async getFreshAddress(opts: EdgeCurrencyCodeOptions): Promise<EdgeFreshAddress> {
    return { publicAddress: this.currencyInfo.defaultSettings.publicAddress }
  }

  async addGapLimitAddresses(addresses: string[]): Promise<void> {}

  async isAddressUsed(address: string): Promise<boolean> {
    return address === this.currencyInfo.defaultSettings.publicAddress
  }

  // Spending:
  async makeSpend(spendInfo: EdgeSpendInfo): Promise<EdgeTransaction> {
    const { currencyCode = this.currencyInfo.currencyCode, spendTargets } = spendInfo
    const tokenSpend = currencyCode !== this.currencyInfo.currencyCode

    // Check the spend targets:
    let total = '0'
    for (const spendTarget of spendTargets) {
      if (spendTarget.nativeAmount != null) {
        total = add(total, spendTarget.nativeAmount)
      }
    }

    // Check the balances:
    if (lt(this.getBalance({ currencyCode }), total)) {
      return await Promise.reject(new InsufficientFundsError())
    }

    // TODO: Return a high-fidelity transaction
    return {
      blockHeight: 0,
      currencyCode,
      date: defaultTx.date,
      feeRateUsed: { fakePrice: 0 },
      memos: [],
      isSend: true,
      nativeAmount: total,
      networkFee: tokenSpend ? '0' : this.defaultSettings.networkFee,
      otherParams: {},
      ourReceiveAddresses: [],
      parentNetworkFee: tokenSpend ? this.defaultSettings.parentNetworkFee : undefined,
      signedTx: '',
      txid: 'spend',
      walletId: 'someid'
    }
  }

  async signTx(transaction: EdgeTransaction): Promise<EdgeTransaction> {
    transaction.txSecret = 'open sesame'
    return transaction
  }

  async broadcastTx(transaction: EdgeTransaction): Promise<EdgeTransaction> {
    return transaction
  }

  async saveTx(transaction: EdgeTransaction): Promise<void> {}

  async accelerate(): Promise<null> {
    return null
  }
}

/**
 * Currency plugin setup object.
 */
class FakeCurrencyTools {
  currencyInfo: EdgeCurrencyInfo

  // Keys:
  constructor(currencyInfo: EdgeCurrencyInfo) {
    this.currencyInfo = currencyInfo
  }

  async createPrivateKey(walletType: string, opts?: JsonObject): Promise<JsonObject> {
    if (walletType !== this.currencyInfo.walletType) {
      throw new Error('Unsupported key type')
    }
    return await Promise.resolve({ fakeKey: 'FakePrivateKey' })
  }

  async derivePublicKey(walletInfo: EdgeWalletInfo): Promise<JsonObject> {
    return await Promise.resolve({
      fakeAddress: 'FakePublicAddress'
    })
  }

  getSplittableTypes(walletInfo: EdgeWalletInfo): string[] {
    return []
  }

  // URI parsing:
  async parseUri(uri: string): Promise<EdgeParsedUri> {
    return await Promise.resolve({})
  }

  async encodeUri(): Promise<string> {
    return await Promise.resolve('')
  }
}

export const makeFakePlugin = (currencyInfo: EdgeCurrencyInfo): EdgeCurrencyPlugin => {
  return {
    currencyInfo,

    async makeCurrencyEngine(walletInfo: EdgeWalletInfo, opts: EdgeCurrencyEngineOptions): Promise<EdgeCurrencyEngine> {
      return await Promise.resolve(new FakeCurrencyEngine(walletInfo, currencyInfo, opts))
    },

    async makeCurrencyTools(): Promise<EdgeCurrencyTools> {
      return await Promise.resolve(new FakeCurrencyTools(currencyInfo))
    }
  }
}
