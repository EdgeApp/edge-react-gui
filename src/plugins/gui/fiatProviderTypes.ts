import { EdgeCurrencyWallet } from 'edge-core-js'

import { EdgeTokenId } from '../../types/types'
import { FiatPaymentTypes, FiatPluginRegionCode, FiatPluginUi } from './fiatPluginTypes'

export interface FiatProviderApproveQuoteParams {
  showUi: FiatPluginUi
  coreWallet: EdgeCurrencyWallet
}

export interface FiatProviderQuote {
  readonly pluginId: string
  readonly partnerIcon: string
  readonly pluginDisplayName: string
  readonly tokenId: EdgeTokenId
  readonly cryptoAmount: string
  readonly isEstimate: boolean
  readonly fiatCurrencyCode: string
  readonly fiatAmount: string
  readonly direction: 'buy' | 'sell'
  readonly expirationDate?: Date
  readonly regionCode: FiatPluginRegionCode
  readonly paymentTypes: FiatPaymentTypes

  approveQuote: (params: FiatProviderApproveQuoteParams) => Promise<void>
  closeQuote: () => Promise<void>
}

type FiatProviderQuoteErrorTypesLimit = 'overLimit' | 'underLimit'
type FiatProviderQuoteErrorTypesOther = 'assetUnsupported' | 'regionRestricted' | 'paymentUnsupported'

export type FiatProviderQuoteErrorTypes = FiatProviderQuoteErrorTypesLimit | FiatProviderQuoteErrorTypesOther

// FiatProviderQuoteError
//
// errorAmount must be in units of the provided FiatProviderGetQuoteParams.exchangeAmount as determined by
// amountType
export type FiatProviderQuoteError =
  | {
      errorType: FiatProviderQuoteErrorTypesOther
    }
  | { errorType: FiatProviderQuoteErrorTypesLimit; errorAmount: number }

export class FiatProviderError extends Error {
  // @ts-expect-error
  name: string
  readonly quoteError: FiatProviderQuoteError

  constructor(info: FiatProviderQuoteError) {
    super('FiatProviderError')
    this.quoteError = info
  }
}

export interface FiatProviderAssetMap {
  crypto: { [pluginId: string]: { [tokenId: string]: boolean | any } }
  fiat: { [currencyCode: string]: boolean | any }
}

export interface FiatProviderGetQuoteParams {
  tokenId: EdgeTokenId
  exchangeAmount: string
  fiatCurrencyCode: string
  amountType: 'fiat' | 'crypto'
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  paymentTypes: FiatPaymentTypes
}

export interface FiatProviderStore {
  readonly deleteItem: (itemId: string) => Promise<void>
  readonly listItemIds: () => Promise<string[]>
  readonly getItem: (itemId: string) => Promise<string>
  readonly setItem: (itemId: string, value: string) => Promise<void>
}

export interface FiatProvider {
  pluginId: string
  partnerIcon: string
  pluginDisplayName: string
  getSupportedAssets: () => Promise<FiatProviderAssetMap>
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote>
}

export interface FiatProviderFactoryParams {
  io: { store: FiatProviderStore }
  apiKeys?: unknown
}

export interface FiatProviderFactory {
  pluginId: string
  storeId: string
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider>
}
