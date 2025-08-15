import type { Disklet } from 'disklet'
import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import type { NavigationBase } from '../../types/routerTypes'
import type { OnLogEvent } from '../../util/tracking'
import type {
  FiatPaymentType,
  FiatPluginRegionCode,
  FiatPluginUtils
} from '../gui/fiatPluginTypes'

// Token support type (kept for internal plugin use if needed)
export interface ProviderToken {
  tokenId: EdgeTokenId
  otherInfo?: unknown
}

// Support checking types
export interface RampCheckSupportRequest {
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  fiatAsset: {
    // ISO currency code (without 'iso:' prefix)
    currencyCode: string
  }
  cryptoAsset: {
    pluginId: string
    tokenId: EdgeTokenId
  }
}

export interface RampSupportResult {
  supported: boolean
}

export interface RampQuoteRequest {
  wallet?: EdgeCurrencyWallet
  pluginId: string
  tokenId: EdgeTokenId
  displayCurrencyCode: string
  exchangeAmount: string | { max: true }
  fiatCurrencyCode: string
  amountType: 'fiat' | 'crypto'
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  pluginUtils?: FiatPluginUtils
  promoCode?: string
}

export interface SettlementRange {
  min: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
  }
  max: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
  }
}

export interface RampQuoteResult {
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
  store?: {
    getItem: (key: string) => Promise<string>
    setItem: (key: string, value: string) => Promise<void>
  }
  makeUuid?: () => Promise<string>

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

  readonly fetchQuote: (
    request: RampQuoteRequest,
    /* to be defined later */
    opts?: unknown
  ) => Promise<RampQuoteResult[]>
}

export type RampPluginFactory = (config: RampPluginConfig) => RampPlugin
