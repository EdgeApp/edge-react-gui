// @flow
import { type EdgeTokenId } from '../../types/types.js'
import { type FiatPluginUi } from './fiatPluginTypes.js'

export type FiatProviderApproveQuoteParams = {
  showUi: FiatPluginUi
}

export type FiatProviderQuote = {
  +tokenId: EdgeTokenId,
  +cryptoAmount: string,
  +isEstimate: boolean,
  +fiatCurrencyCode: string,
  +fiatAmount: string,
  +direction: 'buy' | 'sell',
  +expirationDate?: Date,

  approveQuote(params: FiatProviderApproveQuoteParams): Promise<void>,
  closeQuote(): Promise<void>
}

export type FiatProviderAssetMap = {
  [pluginId: string]: {
    [tokenId: string]: boolean
  }
}

export type FiatProviderGetQuoteParams = {
  tokenId: EdgeTokenId,
  exchangeAmount: string,
  fiatCurrencyCode: string,
  amountType: 'fiat' | 'crypto',
  direction: 'buy' | 'sell'
}

export type FiatProvider = {
  pluginId: string,
  getSupportedAssets: () => Promise<FiatProviderAssetMap>,
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote | void>
}

export type FiatProviderFactoryParams = {
  io: {
    store: Object
  }
}

export type FiatProviderFactory = {
  pluginId: string,
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider>
}
