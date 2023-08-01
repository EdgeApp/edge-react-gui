import { EdgeCurrencyWallet } from 'edge-core-js'

import { FiatPaymentType, FiatPluginRegionCode, FiatPluginUi } from './fiatPluginTypes'

export interface FiatProviderApproveQuoteParams {
  showUi: FiatPluginUi
  coreWallet: EdgeCurrencyWallet
}

export interface FiatProviderQuote {
  readonly providerId: string
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

  approveQuote: (params: FiatProviderApproveQuoteParams) => Promise<void>
  closeQuote: () => Promise<void>
}

type FiatProviderQuoteErrorTypesLimit = 'overLimit' | 'underLimit'
type FiatProviderQuoteErrorTypesRegion = 'regionRestricted'
type FiatProviderQuoteErrorTypesOther = 'assetUnsupported' | 'paymentUnsupported'

export type FiatProviderQuoteErrorTypes = FiatProviderQuoteErrorTypesLimit | FiatProviderQuoteErrorTypesRegion | FiatProviderQuoteErrorTypesOther

// FiatProviderQuoteError
//
// errorAmount must be in units of the provided FiatProviderGetQuoteParams.exchangeAmount as determined by
// amountType
export type FiatProviderQuoteError =
  | { providerId: string; errorType: FiatProviderQuoteErrorTypesOther }
  | { providerId: string; errorType: FiatProviderQuoteErrorTypesLimit; errorAmount?: number }
  | { providerId: string; errorType: FiatProviderQuoteErrorTypesRegion; displayCurrencyCode: string }

export class FiatProviderError extends Error {
  readonly quoteError: FiatProviderQuoteError

  constructor(info: FiatProviderQuoteError) {
    super('FiatProviderError')
    this.quoteError = info
  }
}

// Supported fiats and cryptos per provider
export interface FiatProviderAssetMap {
  crypto: { [pluginId: string]: { [tokenId: string]: boolean | any } }
  fiat: { [currencyCode: string]: boolean | any }
}

export interface FiatProviderGetQuoteParams {
  wallet?: EdgeCurrencyWallet
  pluginId: string
  displayCurrencyCode: string
  exchangeAmount: string
  fiatCurrencyCode: string
  amountType: 'fiat' | 'crypto'
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  paymentTypes: FiatPaymentType[]
}

export interface FiatProviderGetSupportedAssetsParams {
  paymentTypes: FiatPaymentType[]
  regionCode: FiatPluginRegionCode
}

export interface FiatProviderStore {
  readonly deleteItem: (itemId: string) => Promise<void>
  readonly listItemIds: () => Promise<string[]>
  readonly getItem: (itemId: string) => Promise<string>
  readonly setItem: (itemId: string, value: string) => Promise<void>
}

export interface FiatProvider<OtherMethods = null> {
  providerId: string
  partnerIcon: string
  pluginDisplayName: string
  getSupportedAssets: (params: FiatProviderGetSupportedAssetsParams) => Promise<FiatProviderAssetMap>
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote>
  otherMethods: OtherMethods
}

export interface FiatProviderFactoryParams {
  deviceId: string
  io: { store: FiatProviderStore }
  apiKeys?: unknown // Data specific to the requirements of each provider,
  // which lets the provider know that these orders were made from within Edge.
  // Typically an API key, but can be some other information like a client ID.
}

export interface FiatProviderFactory<OtherMethods = null> {
  providerId: string
  storeId: string
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider<OtherMethods>>
}
