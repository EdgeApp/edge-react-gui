import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import type {
  FiatPaymentType,
  FiatPluginRegionCode,
  FiatPluginUi,
  FiatPluginUtils
} from '../gui/fiatPluginTypes'

export interface RampQuoteRequest {
  wallet?: EdgeCurrencyWallet
  pluginId: string
  tokenId: EdgeTokenId
  displayCurrencyCode: string
  exchangeAmount: string
  fiatCurrencyCode: string
  amountType: 'fiat' | 'crypto'
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  pluginUtils: FiatPluginUtils
  promoCode?: string
  paymentTypes: FiatPaymentType[]
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
  readonly paymentTypes: FiatPaymentType[]

  approveQuote: (params: RampApproveQuoteParams) => Promise<void>
  closeQuote: () => Promise<void>
}

export interface RampApproveQuoteParams {
  showUi: FiatPluginUi
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
}

export interface RampPlugin {
  readonly pluginId: string
  readonly rampInfo: RampInfo

  readonly fetchQuote: (
    request: RampQuoteRequest,
    /* to be defined later */
    opts?: unknown
  ) => Promise<RampQuoteResult>
}

export type RampPluginFactory = (config: RampPluginConfig) => RampPlugin
