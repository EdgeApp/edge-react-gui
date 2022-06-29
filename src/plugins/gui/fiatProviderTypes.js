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

type FiatProviderQuoteErrorTypesLimit = 'overLimit' | 'underLimit'
type FiatProviderQuoteErrorTypesOther = 'assetUnsupported' | 'regionRestricted'

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
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote>
}

export type FiatProviderFactoryParams = {
  io: {}
}

export type FiatProviderFactory = {
  pluginId: string,
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider>
}
