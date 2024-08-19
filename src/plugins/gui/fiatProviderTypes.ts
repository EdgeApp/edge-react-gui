import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { FiatPaymentType, FiatPluginRegionCode, FiatPluginUi, FiatPluginUtils } from './fiatPluginTypes'

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
  | { providerId: string; errorType: FiatProviderQuoteErrorTypesLimit; errorAmount?: number; displayCurrencyCode?: string }
  | { providerId: string; errorType: FiatProviderQuoteErrorTypesRegion; displayCurrencyCode?: string }

export class FiatProviderError extends Error {
  readonly quoteError: FiatProviderQuoteError

  constructor(info: FiatProviderQuoteError) {
    super('FiatProviderError')
    this.quoteError = info
  }
}

export interface ProviderToken {
  tokenId: EdgeTokenId
  otherInfo?: unknown
}

/**
 * Map of countryCodes that need to filter by stateProvince
 * Lack of a countryCode means that it does not need filtering
 * by stateProvince and is therefore supported by default or will
 * be filtered by some other means in the provider.
 */
export interface FiatProviderSupportedRegions {
  [countryCode: string]: {
    forStateProvinces?: string[]
    notStateProvinces?: string[]
  }
}

/**
 * Map of supported countryCodes
 * All supported countries must be in the map. A value of undefined, null, or false
 * means the country is not supported. True or an object means it
 * is supported. An object means support is conditional on the stateProvince.
 */
export interface FiatProviderExactRegions {
  [countryCode: string]:
    | boolean
    | {
        forStateProvinces?: string[]
        notStateProvinces?: string[]
      }
}

// Supported fiats and cryptos per provider
export interface FiatProviderAssetMap {
  providerId: string
  crypto: { [pluginId: string]: ProviderToken[] }
  fiat: { [currencyCode: string]: boolean | any }

  // This provider REQUIRES that the user enter the amount
  // in the specified currency.
  requiredAmountType?: 'fiat' | 'crypto'
}

export interface FiatProviderGetQuoteParams {
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

export interface FiatProviderGetSupportedAssetsParams {
  direction: 'buy' | 'sell'
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

export type FiatProviderGetTokenId = (pluginId: string, currencyCode: string) => EdgeTokenId | undefined
export type FiatProviderMakeUuid = () => Promise<string>
export interface FiatProviderFactoryParams {
  deviceId: string
  io: { store: FiatProviderStore; makeUuid: FiatProviderMakeUuid }
  getTokenId: FiatProviderGetTokenId
  apiKeys?: unknown // Data specific to the requirements of each provider,
  // which lets the provider know that these orders were made from within Edge.
  // Typically an API key, but can be some other information like a client ID.
}

export interface FiatProviderFactory<OtherMethods = null> {
  providerId: string
  storeId: string
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider<OtherMethods>>
}
