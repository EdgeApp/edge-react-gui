// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { type EdgeTokenId } from '../../types/types.js'
import { type FiatPaymentTypes, type FiatPluginRegionCode, type FiatPluginUi, type FiatTxDirection } from './fiatPluginTypes.js'

export type FiatProviderApproveQuoteParams = {
  showUi: FiatPluginUi,
  coreWallet: EdgeCurrencyWallet
}

export type FiatProviderQuote = {
  +pluginId: string,
  +partnerIcon: string,
  +pluginDisplayName: string,
  +tokenId: EdgeTokenId,
  +cryptoAmount: string,
  +isEstimate: boolean,
  +fiatCurrencyCode: string,
  +fiatAmount: string,
  +expirationDate?: Date,
  +regionCode: FiatPluginRegionCode,
  +paymentTypes: FiatPaymentTypes,

  approveQuote(params: FiatProviderApproveQuoteParams): Promise<void>,
  closeQuote(): Promise<void>
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
  | { errorType: FiatProviderQuoteErrorTypesLimit, errorAmount: number }

export class FiatProviderError extends Error {
  name: string
  +quoteError: FiatProviderQuoteError

  constructor(info: FiatProviderQuoteError) {
    super('FiatProviderError')
    this.quoteError = info
  }
}

export type FiatProviderAssetMap = {
  crypto: { [pluginId: string]: { [tokenId: string]: boolean | Object } },
  fiat: { [currencyCode: string]: boolean | Object }
}

export type FiatProviderGetQuoteParams = {
  tokenId: EdgeTokenId,
  exchangeAmount: string,
  fiatCurrencyCode: string,
  amountType: 'fiat' | 'crypto',
  regionCode: FiatPluginRegionCode,
  paymentTypes: FiatPaymentTypes
}

export type FiatProviderStore = {
  +deleteItem: (itemId: string) => Promise<void>,
  +listItemIds: () => Promise<string[]>,
  +getItem: (itemId: string) => Promise<string>,
  +setItem: (itemId: string, value: string) => Promise<void>
}

export type FiatProvider = {
  pluginId: string,
  partnerIcon: string,
  pluginDisplayName: string,
  getSupportedAssets: () => Promise<FiatProviderAssetMap>,
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote>
}

export type FiatProviderFactoryParams = {
  io: { store: FiatProviderStore },
  direction: FiatTxDirection,
  apiKeys?: mixed
}

export type FiatProviderFactory = {
  pluginId: string,
  storeId: string,
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider>
}
