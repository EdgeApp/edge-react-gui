import { gt, lt } from 'biggystring'
import { asArray, asBoolean, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import URL from 'url-parse'

import { FiatDirection, FiatPaymentType } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'
const providerId = 'kado'
const storeId = 'money.kado'
const partnerIcon = 'kado.png'
const pluginDisplayName = 'Kado'

const urls = {
  api: {
    prod: 'https://api.kado.money',
    test: 'https://test-api.kado.money'
  },
  widget: {
    prod: 'https://app.kado.money',
    test: 'https://sandbox--kado.netlify.app'
  }
}

// https://api.kado.money/v1/ramp/blockchains

// Maps Edge pluginIds to Kado blockchain.origin values
const PLUGIN_TO_CHAIN_ID_MAP: { [pluginId: string]: string } = {
  stellar: 'stellar',
  solana: 'solana',
  ripple: 'ripple',
  polygon: 'polygon',
  osmosis: 'osmosis',
  optimism: 'optimism',
  litecoin: 'litecoin',
  ethereum: 'ethereum',
  avalanche: 'avalanche',
  cosmos: 'cosmos hub',
  bitcoin: 'bitcoin'
}

const PLUGINDS_TO_SYMBOL: { [pluginId: string]: string } = {
  stellar: 'XLM',
  solana: 'SOL',
  ripple: 'XRP',
  polygon: 'MATIC',
  osmosis: 'OSMO',
  optimism: 'ETH',
  litecoin: 'LTC',
  ethereum: 'ETH',
  avalanche: 'AVAX',
  cosmos: 'ATOM',
  bitcoin: 'BTC'
}

const PLUGINIDS_WITH_TOKENS: { [pluginId: string]: boolean } = {
  polygon: true,
  optimism: true,
  litecoin: true,
  ethereum: true,
  avalanche: true
}

const CHAIN_ID_TO_PLUGIN_MAP: { [chainId: string]: string } = Object.entries(PLUGIN_TO_CHAIN_ID_MAP).reduce(
  (out: { [chainId: string]: string }, [pluginId, chainId]) => {
    out[chainId] = pluginId
    return out
  },
  {}
)

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    iach: true
  },
  sell: {
    ach: false
  }
}

const allowedBuyCurrencyCodes: FiatProviderAssetMap = { providerId, requiredAmountType: 'fiat', crypto: {}, fiat: {} }
const allowedSellCurrencyCodes: FiatProviderAssetMap = { providerId, requiredAmountType: 'crypto', crypto: {}, fiat: {} }
const allowedCountryCodes: { [code: string]: boolean } = { US: true }

// Define cleaners for the nested structures first
// const asPrimeTrust = asObject({
//   assetId: asString,
//   assetTransferType: asString,
//   assetType: asString
// })

const asAssociatedAsset = asObject({
  // _id: asString,
  // name: asString,
  // description: asString,
  // label: asString,
  symbol: asString,
  // supportedProviders: asArray(asString),
  // primeTrust: asPrimeTrust,
  // stablecoin: asBoolean,
  liveOnRamp: asBoolean,
  // usesOsmoRouter: asOptional(asBoolean),
  // usesLifiRouter: asOptional(asBoolean),
  // usesAvaxRouter: asOptional(asBoolean),
  // usesInjectiveRouter: asOptional(asBoolean),
  // supportedOperations: asOptional(asArray(asUnknown)),
  // ibcDenom: asOptional(asString),
  // ibcChannelIdOnRamp: asOptional(asNumber),
  // ibcChannelIdOffRamp: asOptional(asNumber),
  // coingeckoId: asString,
  // createdAt: asDate,
  // updatedAt: asDate,
  // __v: asOptional(asNumber),
  // priority: asOptional(asNumber),
  address: asOptional(asString),
  // blockExplorerURI: asOptional(asString),
  // decimals: asOptional(asNumber),
  // officialChainId: asOptional(asString),
  // precision: asOptional(asNumber),
  rampProducts: asOptional(asArray(asValue('buy', 'sell')))
  // wallets: asOptional(asArray(asString)),
  // fortressSymbol: asOptional(asString),
  // fortressChainId: asOptional(asString),
  // squidChainId: asOptional(asString),
  // squidWalletExample: asOptional(asString),
  // squidAssetId: asOptional(asString),
  // canBeUsedForLiquidityFulfillment: asOptional(asBoolean),
  // rpcURI: asOptional(asString),
  // usesPolygonFulfillment: asOptional(asBoolean),
  // contractAddress: asOptional(asString)
  // fallbackAddress: asOptional(asString),
  // fallbackAddressCoinType: asOptional(asNumber),
  // lifiSymbol: asOptional(asString),
  // displayPrecision: asOptional(asNumber),
  // osmoPfmChannel: asOptional(asNumber),
  // osmoPfmReceiver: asOptional(asString)
})

const asBlockchain = asObject({
  // _id: asString,
  // supportedEnvironment: asMaybe(asValue('production')),
  // network: asString,
  origin: asString,
  // label: asString,
  associatedAssets: asArray(asAssociatedAsset),
  // avgTransactionTimeSeconds: asNumber,
  liveOnRamp: asBoolean
  // createdAt: asDate,
  // updatedAt: asDate,
  // __v: asOptional(asNumber),
  // priority: asOptional(asNumber),
  // ecosystem: asOptional(asString),
  // officialId: asString
  // usesAvaxRouter: asOptional(asBoolean),
  // usesInjectiveRouter: asOptional(asBoolean),
  // usesLifiRouter: asOptional(asBoolean),
  // usesOsmoRouter: asOptional(asBoolean),
  // fortressId: asOptional(asString),
  // networkFee: asOptional(
  //   asObject({
  //     unit: asString,
  //     amount: asNumber
  //   })
  // )
})

// Define the main cleaner
const asBlockchains = asObject({
  success: asBoolean,
  // message: asString,
  data: asObject({
    blockchains: asArray(asBlockchain)
  })
})

// Define cleaners for nested objects and properties
// const asAmountCurrency = asObject({
//   amount: asNumber,
//   currency: asString
// })

// const asRequest = asObject({
//   transactionType: asValue('buy', 'sell'),
//   fiatMethod: asString,
//   amount: asNumber,
//   blockchain: asString,
//   currency: asString,
//   asset: asString,
//   partner: asString
// })

// const asPrice = asObject({
//   amount: asNumber,
//   price: asNumber,
//   symbol: asString,
//   unit: asString
// })

const asMinMaxValue = asObject({
  amount: asNumber,
  unit: asString
})

const asQuote = asObject({
  // asset: asString,
  // baseAmount: asAmountCurrency,
  // pricePerUnit: asNumber,
  // price: asPrice,
  // processingFee: asAmountCurrency,
  // bridgeFee: asAmountCurrency,
  // networkFee: asAmountCurrency,
  // smartContractFee: asAmountCurrency,
  // totalFee: asAmountCurrency,
  // receiveAmountAfterFees: asAmountCurrency,
  // receiveUnitCountAfterFees: asAmountCurrency,
  receive: asObject({
    // originalAmount: asNumber,
    amount: asNumber,
    // unit: asString,
    unitCount: asNumber
    // symbol: asString
  }),
  // feeType: asString,
  minValue: asMinMaxValue,
  maxValue: asMinMaxValue
})

// Main cleaner for the JSON structure
const asQuoteResponse = asObject({
  success: asBoolean,
  message: asString,
  data: asObject({
    // request: asRequest,
    quote: asQuote
  })
})

const asApiKeys = asObject({
  apiKey: asString
})

const asTokenOtherInfo = asObject({
  symbol: asString
})

interface GetQuoteParams {
  transactionType: 'buy' | 'sell'
  fiatMethod: 'ach' | 'card'
  amount: number
  blockchain: string
  currency: string
  asset: string
}

export const kadoProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys } = params
    const { apiKey } = asApiKeys(apiKeys)
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes }): Promise<FiatProviderAssetMap> => {
        // XXX Todo: add sell support
        if (direction !== 'buy') throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        const allowedCurrencyCodes = direction === 'buy' ? allowedBuyCurrencyCodes : allowedSellCurrencyCodes

        if (Object.keys(allowedCurrencyCodes.crypto).length > 0) {
          return allowedCurrencyCodes
        }

        const response = await fetch(`${urls.api.prod}/v1/ramp/blockchains`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Id': apiKey
          }
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching kado blockchains: ${text}`)
        }
        const result = await response.json()

        const blockchains = asBlockchains(result)
        if (!blockchains.success) {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }

        for (const blockchain of blockchains.data.blockchains) {
          const pluginId = CHAIN_ID_TO_PLUGIN_MAP[blockchain.origin]
          if (pluginId == null) continue
          allowedCurrencyCodes.crypto[pluginId] = []
          const tokens = allowedCurrencyCodes.crypto[pluginId]
          tokens.push({ tokenId: null, otherInfo: { symbol: PLUGINDS_TO_SYMBOL[pluginId] } })

          if (PLUGINIDS_WITH_TOKENS[pluginId]) {
            for (const asset of blockchain.associatedAssets) {
              if (!asset.liveOnRamp) continue
              if (asset.address != null && asset.address !== '0x0000000000000000000000000000000000000000') {
                if (asset.rampProducts != null && asset.rampProducts.includes(direction)) {
                  const tokenId = asset.address.toLowerCase().replace('0x', '')
                  tokens.push({ tokenId, otherInfo: { symbol: asset.symbol } })
                }
              }
            }
          }
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { direction, regionCode, exchangeAmount, amountType, paymentTypes, pluginId, displayCurrencyCode, tokenId } = params
        if (direction !== 'buy') throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const allowedCurrencyCodes = direction === 'buy' ? allowedBuyCurrencyCodes : allowedSellCurrencyCodes

        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (direction === 'buy' && amountType !== 'fiat') {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }
        // @ts-expect-error
        if (direction === 'sell' && amountType !== 'crypto') {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const tokens = allowedCurrencyCodes.crypto[pluginId]
        const token = tokens.find(t => t.tokenId === tokenId)
        if (token == null) throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        const { symbol: asset } = asTokenOtherInfo(token.otherInfo)
        const blockchain = PLUGIN_TO_CHAIN_ID_MAP[pluginId]

        // Query for a quote
        const queryParams: GetQuoteParams = {
          transactionType: direction,
          fiatMethod: 'ach',
          amount: Number(exchangeAmount),
          blockchain,
          currency: 'USD',
          asset
        }

        const urlObj = new URL(`${urls.api.prod}/v2/ramp/quote`, true)
        urlObj.set('query', queryParams)

        const response = await fetch(urlObj.href, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Id': apiKey
          }
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching kado quote: ${text}`)
        }
        const result = await response.json()
        const quote = asQuoteResponse(result)

        const { amount: minAmount, unit: minUnit } = quote.data.quote.minValue
        const { amount: maxAmount, unit: maxUnit } = quote.data.quote.maxValue

        let fiatAmount: string
        let cryptoAmount: string
        if (direction === 'buy') {
          const { unitCount } = quote.data.quote.receive
          cryptoAmount = unitCount.toString()
          fiatAmount = exchangeAmount
        } else {
          const { amount } = quote.data.quote.receive
          cryptoAmount = exchangeAmount
          fiatAmount = amount.toString()
        }
        if (lt(fiatAmount, minAmount.toString()))
          throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: minAmount, displayCurrencyCode: minUnit })
        if (gt(fiatAmount, maxAmount.toString()))
          throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: maxAmount, displayCurrencyCode: maxUnit })

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          cryptoAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 60000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId })

            const url = new URL(`${urls.widget.prod}/`, true)
            if (direction === 'buy') {
              url.set('query', {
                apiKey: apiKey,
                network: blockchain,
                networkList: blockchain,
                onPayAmount: fiatAmount,
                onPayCurrency: 'USD',
                onRevCurrency: asset,
                onToAddress: receiveAddress.publicAddress,
                product: 'BUY',
                productList: 'BUY',
                mode: 'minimal'
              })
            } else {
              url.set('query', {
                apiKey: apiKey,
                network: blockchain,
                networkList: blockchain,
                onPayAmount: cryptoAmount,
                offRevCurrency: 'USD',
                product: 'SELL',
                productList: 'SELL',
                mode: 'minimal',
                offPayCurrency: asset,
                offFromAddress: receiveAddress.publicAddress
              })
            }
            if (direction !== 'buy') throw new Error('Kado does not support selling yet')
            console.log('Launching Kado webview url=' + url.href)

            // Only open standard webview of ACH and sells.
            // Use showUi.openExternalWebView for Apple Pay/Google Pay
            await showUi.openWebView({ url: url.href })
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      },
      otherMethods: null
    }
    return out
  }
}
