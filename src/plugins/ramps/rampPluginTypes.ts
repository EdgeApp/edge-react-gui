import type { Disklet } from 'disklet'
import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import type { NavigationBase } from '../../types/routerTypes'
import type { OnLogEvent } from '../../util/tracking'
import type {
  FiatPaymentType,
  FiatPluginRegionCode
} from '../gui/fiatPluginTypes'
import type { RampPluginStore } from './utils/createStore'

// Token support type (kept for internal plugin use if needed)
export interface ProviderToken {
  tokenId: EdgeTokenId
  otherInfo?: unknown
}

export interface CryptoAsset {
  pluginId: string
  tokenId: EdgeTokenId
}

// Support checking types
export interface RampCheckSupportRequest {
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  fiatAsset: {
    // ISO currency code (without 'iso:' prefix)
    currencyCode: string
  }
  cryptoAsset: CryptoAsset
}

export interface RampSupportResult {
  supported: boolean
  // Indicates which amount types are supported by this plugin
  supportedAmountTypes?: Array<'fiat' | 'crypto'>
}

export type RampExchangeAmount =
  | {
      max: true
    }
  | { amount: string }

export interface RampQuoteRequest {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  displayCurrencyCode: string
  exchangeAmount: RampExchangeAmount
  fiatCurrencyCode: string
  amountType: 'fiat' | 'crypto'
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  promoCode?: string
}

export interface SettlementRange {
  min: {
    value: number
    unit: SettlementRangeUnit
  }
  max: {
    value: number
    unit: SettlementRangeUnit
  }
}

export type SettlementRangeUnit = 'minutes' | 'hours' | 'days'

export interface RampQuote {
  readonly pluginId: string
  readonly partnerIcon: string
  readonly pluginDisplayName: string
  readonly displayCurrencyCode: string
  readonly cryptoAmount: string
  readonly isEstimate: boolean
  readonly fiatCurrencyCode: string
  readonly fiatAmount: string
  readonly direction: 'buy' | 'sell'
  readonly expirationDate?: Date
  readonly regionCode: FiatPluginRegionCode
  readonly paymentType: FiatPaymentType
  readonly settlementRange: SettlementRange

  approveQuote: (params: RampApproveQuoteParams) => Promise<void>
  closeQuote: () => Promise<void>
}

/**
 * Parameters passed to the approveQuote function.
 */
export interface RampApproveQuoteParams {
  coreWallet: EdgeCurrencyWallet
}

export interface RampInfo {
  readonly partnerIcon: string
  readonly pluginDisplayName: string
}

export interface RampPluginConfig {
  initOptions?: unknown
  store: RampPluginStore

  // Dependencies for plugin operations
  account: EdgeAccount
  navigation: NavigationBase
  onLogEvent: OnLogEvent
  disklet: Disklet
}

export interface RampPlugin {
  readonly pluginId: string
  readonly rampInfo: RampInfo

  /** Used to check if a plugin supports certain direction, region, and asset pair */
  readonly checkSupport: (
    request: RampCheckSupportRequest
  ) => Promise<RampSupportResult>

  readonly fetchQuotes: (
    request: RampQuoteRequest,
    /* to be defined later */
    opts?: unknown
  ) => Promise<RampQuote[]>
}

export type RampPluginFactory = (config: RampPluginConfig) => RampPlugin
