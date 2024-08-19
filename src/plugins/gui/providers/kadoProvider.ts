import { gt, lt } from 'biggystring'
import { asArray, asBoolean, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeAssetAction, EdgeSpendInfo, EdgeTokenId, EdgeTxActionFiat } from 'edge-core-js'
import URL from 'url-parse'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { ENV } from '../../../env'
import { lstrings } from '../../../locales/strings'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { datelog, isHex } from '../../../util/utils'
import { SendErrorBackPressed, SendErrorNoTransaction } from '../fiatPlugin'
import { FiatDirection, FiatPaymentType, SaveTxActionParams } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderExactRegions,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { validateExactRegion } from './common'
const providerId = 'kado'
const storeId = 'money.kado'
const partnerIcon = 'kado.png'
const pluginDisplayName = 'Kado'
const providerDisplayName = 'Kado'
const supportEmail = 'support@kado.money'

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

const MODE = ENV.ENABLE_FIAT_SANDBOX ? 'test' : 'prod'

// https://api.kado.money/v1/ramp/blockchains

// Maps Edge pluginIds to Kado blockchain.origin values
const PLUGIN_TO_CHAIN_ID_MAP: { [pluginId: string]: string } = {
  // stellar: 'stellar', // Needs destination tag support
  solana: 'solana',
  // ripple: 'ripple', // Needs destination tag support
  polygon: 'polygon',
  osmosis: 'osmosis',
  optimism: 'optimism',
  litecoin: 'litecoin',
  ethereum: 'ethereum',
  avalanche: 'avalanche',
  // cosmos: 'cosmos hub',
  bitcoin: 'bitcoin'
}

const CHAIN_ID_TO_PLUGIN_MAP: { [chainId: string]: string } = Object.entries(PLUGIN_TO_CHAIN_ID_MAP).reduce(
  (out: { [chainId: string]: string }, [pluginId, chainId]) => {
    out[chainId] = pluginId
    return out
  },
  {}
)

const SUPPORTED_REGIONS: FiatProviderExactRegions = {
  US: {
    notStateProvinces: ['FL', 'NY', 'TX']
  }
}

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    iach: true,
    wire: true
  },
  sell: {
    ach: true
  }
}

const allowedBuyCurrencyCodes: FiatProviderAssetMap = { providerId, requiredAmountType: 'fiat', crypto: {}, fiat: {} }
const allowedSellCurrencyCodes: FiatProviderAssetMap = { providerId, requiredAmountType: 'crypto', crypto: {}, fiat: {} }
const allowedCountryCodes: { [code: string]: boolean } = { US: true }

/**
 * Cleaner for /v1/ramp/blockchains
 */

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
  liveOnRamp: asOptional(asBoolean),
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
  isNative: asBoolean,
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

/**
 * Cleaner for /v2/ramp/quote
 */

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

/**
 * Cleaner for /v2/public/orders/{orderId}
 */

// const asFeeItem = asObject({
//   amount: asNumber,
//   name: asString,
//   unit: asString,
//   // discount: asOptional(asEither(asString, asNull)),
//   createdAt: asString,
//   updatedAt: asString
// })

// const asProcessingFee = asObject({
//   amount: asNumber,
//   unit: asString,
//   name: asString,
//   originalAmount: asNumber,
//   promotionModifier: asNumber
// })

const asCryptoCurrency = asObject({
  // usesOsmoRouter: asBoolean,
  // usesLifiRouter: asBoolean,
  // usesAvaxRouter: asBoolean,
  // usesPolygonFulfillment: asBoolean,
  // usesAxelarBridge: asBoolean,
  // usesInjectiveRouter: asBoolean,
  // supportedOperations: asArray(asString),
  // canBeUsedForLiquidityFulfillment: asBoolean,
  // canBeUsedWithFireblocks: asBoolean,
  // logoURI: asString,
  // fallbackAddress: asString,
  // fallbackAddressCoinType: asNumber,
  // rpcUrl: asString,
  // osmoPfmChannel: asOptional(asString),
  // osmoPfmReceiver: asString,
  // _id: asString,
  // name: asString,
  // description: asString,
  // label: asString,
  // supportedProviders: asArray(asString),
  // stablecoin: asBoolean,
  // liveOnRamp: asBoolean,
  // priority: asNumber,
  // createdAt: asString,
  // updatedAt: asString,
  symbol: asString,
  // fortressSymbol: asString,
  // fortressChainId: asString,
  // coingeckoId: asString,
  address: asOptional(asString),
  isNative: asBoolean
  // blockExplorerURI: asString,
  // decimals: asNumber,
  // officialChainId: asString,
  // precision: asNumber,
  // rampProducts: asArray(asString),
  // wallets: asArray(asString)
})

// const asChain = asObject({
// _id: asString,
// supportedEnvironment: asString,
// network: asString,
// origin: asString
// label: asString,
// associatedAssets: asArray(asString),
// avgTransactionTimeSeconds: asNumber,
// liveOnRamp: asBoolean,
// priority: asNumber,
// createdAt: asString,
// updatedAt: asString,
// ecosystem: asString,
// fortressId: asString,
// officialId: asString
// })

const asAmountUnitPair = asObject({
  amount: asOptional(asNumber),
  unit: asString
})

const asOrderData = asObject({
  // to: asString,
  // from: asString,
  // exchangeRate: asNumber,
  // currencyType: asString,
  // walletAddress: asString,
  depositAddress: asString,
  // sendFrom: asString,
  // sendTo: asString,
  // processingFee: asProcessingFee,
  // bridgeFee: asArray(asFeeItem),
  // smartContractFees: asArray(asFeeItem),
  // gasFee: asOptional(asEither(asNumber, asNull)),
  // asset: asString,
  // assetSymbol: asString,
  blockchain: asString,
  // txHash: asString,
  // humanStatusField: asString,
  // machineStatusField: asString,
  providerDisbursementStatus: asString,
  // manualDepositWalletAddress: asOptional(asString),
  // manualDepositMemo: asOptional(asString),
  // createdAt: asString,
  // paymentStatus: asOptional(asString),
  // transferStatus: asString,
  // allPossibleTxHashes: asObject({}),
  // method: asString,
  // orderType: asString,
  // id: asString,
  // originOfOrder: asString,
  // userRef: asString,
  // anchorTransactionId: asString,
  // quote: asAmountUnitPair,
  payAmount: asAmountUnitPair,
  // recvAmount: asAmountUnitPair,
  // totalFee: asAmountUnitPair,
  cryptoCurrency: asCryptoCurrency
  // chain: asChain
  // settlementTimeInSeconds: asNumber
})

const asWebviewMessage = asObject({ type: asValue('PLAID_NEW_ACH_LINK'), payload: asObject({ link: asString }) })

const asOrderInfo = asObject({
  success: asBoolean,
  message: asString,
  data: asOrderData
})

interface GetQuoteParams {
  transactionType: 'buy' | 'sell'
  fiatMethod: 'ach' | 'card' | 'wire'
  amount: number
  blockchain: string
  currency: string
  asset: string
}

interface WidgetParams {
  apiKey: string
  isMobileWebview: true
  mode: 'minimal'
  network: string
  networkList: string
  fiatMethodList: string
}

interface WidgetParamsBuy extends WidgetParams {
  onPayAmount: string
  onPayCurrency: 'USD'
  onRevCurrency: string
  onToAddress: string
  product: 'BUY'
  productList: 'BUY'
}

interface WidgetParamsSell extends WidgetParams {
  offFromAddress: string
  offPayAmount: string
  offPayCurrency: string
  offRevCurrency: 'USD'
  product: 'SELL'
  productList: 'SELL'
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
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        validateExactRegion(providerId, regionCode, SUPPORTED_REGIONS)
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        const allowedCurrencyCodes = direction === 'buy' ? allowedBuyCurrencyCodes : allowedSellCurrencyCodes

        if (Object.keys(allowedCurrencyCodes.crypto).length > 0) {
          return allowedCurrencyCodes
        }

        const response = await fetch(`${urls.api[MODE]}/v1/ramp/blockchains`, {
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
          const { liveOnRamp } = blockchain
          if (!liveOnRamp) continue
          const pluginId = CHAIN_ID_TO_PLUGIN_MAP[blockchain.origin]
          if (pluginId == null) continue
          allowedCurrencyCodes.crypto[pluginId] = []
          const tokens = allowedCurrencyCodes.crypto[pluginId]

          for (const asset of blockchain.associatedAssets) {
            const { isNative, address } = asset

            if (asset.rampProducts == null || !asset.rampProducts.includes(direction)) continue
            if (isNative) {
              tokens.push({ tokenId: null, otherInfo: { symbol: asset.symbol } })
              continue
            }

            if (address != null && address !== '0x0000000000000000000000000000000000000000') {
              let tokenId: string
              if (address.startsWith('0x')) {
                // For EVM tokens only, lowercase and remove 0x
                tokenId = address.toLowerCase().replace('0x', '')
              } else {
                tokenId = address
              }
              tokens.push({ tokenId, otherInfo: { symbol: asset.symbol } })
            }
          }
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { direction, regionCode, exchangeAmount, amountType, paymentTypes, pluginId, displayCurrencyCode, tokenId } = params
        validateExactRegion(providerId, regionCode, SUPPORTED_REGIONS)

        const allowedCurrencyCodes = direction === 'buy' ? allowedBuyCurrencyCodes : allowedSellCurrencyCodes

        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (direction === 'buy' && amountType !== 'fiat') {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }
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
        let fiatMethodList: string
        let fiatMethod: GetQuoteParams['fiatMethod']
        if (paymentTypes[0] === 'wire') {
          fiatMethod = 'wire'
          fiatMethodList = 'wire'
        } else if (paymentTypes[0] === 'ach' || paymentTypes[0] === 'iach') {
          fiatMethod = 'ach'
          fiatMethodList = 'ach,wire'
        } else {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }

        const queryParams: GetQuoteParams = {
          transactionType: direction,
          fiatMethod,
          amount: Number(exchangeAmount),
          blockchain,
          currency: 'USD',
          asset
        }

        const urlObj = new URL(`${urls.api[MODE]}/v2/ramp/quote`, true)
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
          isEstimate: true,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          cryptoAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 60000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId })

            const url = new URL(`${urls.widget[MODE]}/`, true)
            if (direction === 'buy') {
              const urlParams: WidgetParamsBuy = {
                apiKey: apiKey,
                fiatMethodList,
                isMobileWebview: true,
                network: blockchain,
                networkList: blockchain,
                onPayAmount: fiatAmount,
                onPayCurrency: 'USD',
                onRevCurrency: asset,
                onToAddress: receiveAddress.publicAddress,
                product: 'BUY',
                productList: 'BUY',
                mode: 'minimal'
              }
              url.set('query', urlParams)
            } else {
              const urlParams: WidgetParamsSell = {
                apiKey: apiKey,
                fiatMethodList,
                isMobileWebview: true,
                network: blockchain,
                networkList: blockchain,
                offPayAmount: cryptoAmount,
                offRevCurrency: 'USD',
                product: 'SELL',
                productList: 'SELL',
                mode: 'minimal',
                offPayCurrency: asset,
                offFromAddress: receiveAddress.publicAddress
              }
              url.set('query', urlParams)
            }
            console.log('Launching Kado webview url=' + url.href)

            // If Kado needs to launch the Plaid bank linking widget, it needs it in an external
            // webview to prevent some glitchiness. When needed, Kado will send an onMessage
            // trigger with the url to open. The below code is derived from Kado's sample code
            const onMessage = (data: string) => {
              try {
                datelog(`**** Kado onMessage ${data}`)
                const message = asWebviewMessage(JSON.parse(data))
                showUi.openExternalWebView({ url: message.payload.link, redirectExternal: true }).catch(e => {
                  throw e
                })
              } catch (error) {
                // Handle parsing errors gracefully
                showUi.showError(`Error parsing message: ${String(error)}`).catch(e => {})
              }
            }

            // Only open standard webview of ACH and sells.
            // Use showUi.openExternalWebView for Apple Pay/Google Pay
            if (direction === 'buy') {
              await showUi.openWebView({
                url: url.href,
                onMessage
              })
              return
            }

            let inPayment = false

            const openWebView = async () => {
              await showUi.openWebView({
                url: url.href,
                onMessage,
                onUrlChange: async newUrl => {
                  console.log(`*** onUrlChange: ${newUrl}`)

                  if (!newUrl.startsWith(`${urls.widget[MODE]}/ramp/order`)) {
                    return
                  }
                  const urlObj = new URL(newUrl, true)
                  const path = urlObj.pathname
                  const orderId = path.split('/')[3]

                  if (isHex(orderId)) {
                    if (inPayment) return
                    inPayment = true
                    try {
                      const response = await fetch(`${urls.api[MODE]}/v2/public/orders/${orderId}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Widget-Id': apiKey
                        }
                      })
                      if (!response.ok) {
                        const text = await response.text()
                        console.warn(`Error fetching kado blockchains: ${text}`)
                        return allowedCurrencyCodes
                      }
                      const result = await response.json()

                      const orderInfo = asOrderInfo(result)
                      if (!orderInfo.success) {
                        await showUi.showError(lstrings.fiat_plugin_sell_failed_try_again + '\n\norderInfo.success=false')
                        inPayment = false
                        return
                      }

                      const { depositAddress, blockchain, cryptoCurrency, payAmount, providerDisbursementStatus } = orderInfo.data
                      const { amount, unit } = payAmount
                      const { address, isNative } = cryptoCurrency

                      if (amount == null) {
                        inPayment = false
                        await showUi.showError(lstrings.fiat_plugin_sell_failed_try_again + '\n\nMissing amount')
                        return
                      }
                      const paymentExchangeAmount = amount.toString()
                      const paymentPluginId = CHAIN_ID_TO_PLUGIN_MAP[blockchain]
                      if (paymentPluginId == null || paymentPluginId !== pluginId) {
                        inPayment = false
                        await showUi.showError(lstrings.fiat_plugin_sell_failed_try_again + '\n\nMismatched pluginId')
                        return
                      }

                      let paymentTokenId: EdgeTokenId
                      if (isNative) {
                        paymentTokenId = null
                      } else if (address != null && address !== '0x0000000000000000000000000000000000000000') {
                        if (address.startsWith('0x')) {
                          // For EVM tokens only, lowercase and remove 0x
                          paymentTokenId = address.toLowerCase().replace('0x', '')
                        } else {
                          paymentTokenId = address
                        }
                      } else {
                        throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
                      }

                      if (paymentTokenId !== tokenId) {
                        inPayment = false
                        await showUi.showError(lstrings.fiat_plugin_sell_failed_try_again + '\n\nMismatched tokenId')
                        return
                      }

                      if (providerDisbursementStatus !== 'pending') {
                        await showUi.showError(lstrings.fiat_plugin_sell_failed_try_again + `\n\nproviderDisbursementStatus=${providerDisbursementStatus}`)
                        inPayment = false
                        return
                      }

                      console.log(`Creating Kado payment`)
                      console.log(`  paymentExchangeAmount: ${paymentExchangeAmount}`)
                      console.log(`  unit: ${unit}`)
                      console.log(`  blockchain: ${blockchain}`)
                      console.log(`  pluginId: ${pluginId}`)
                      console.log(`  tokenId: ${tokenId}`)
                      const nativeAmount = await coreWallet.denominationToNative(paymentExchangeAmount, displayCurrencyCode)

                      const assetAction: EdgeAssetAction = {
                        assetActionType: 'sell'
                      }
                      const savedAction: EdgeTxActionFiat = {
                        actionType: 'fiat',
                        orderId,
                        orderUri: `${urls.widget[MODE]}/ramp/order/${orderId}`,
                        isEstimate: true,
                        fiatPlugin: {
                          providerId,
                          providerDisplayName,
                          supportEmail
                        },
                        payinAddress: depositAddress,
                        cryptoAsset: {
                          pluginId,
                          tokenId,
                          nativeAmount
                        },
                        fiatAsset: {
                          fiatCurrencyCode: 'USD',
                          fiatAmount
                        }
                      }

                      // Launch the SendScene to make payment
                      const spendInfo: EdgeSpendInfo = {
                        tokenId,
                        assetAction,
                        savedAction,
                        spendTargets: [
                          {
                            nativeAmount,
                            publicAddress: depositAddress
                          }
                        ]
                      }

                      const sendParams: SendScene2Params = {
                        walletId: coreWallet.id,
                        tokenId,
                        spendInfo,
                        lockTilesMap: {
                          address: true,
                          amount: true,
                          wallet: true
                        },
                        hiddenFeaturesMap: {
                          address: true
                        }
                      }
                      const tx = await showUi.send(sendParams)
                      await showUi.trackConversion('Sell_Success', {
                        conversionValues: {
                          conversionType: 'sell',
                          destFiatCurrencyCode: 'USD',
                          destFiatAmount: fiatAmount,
                          sourceAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            currencyCode: displayCurrencyCode,
                            exchangeAmount: paymentExchangeAmount
                          }),
                          fiatProviderId: providerId,
                          orderId
                        }
                      })

                      // Save separate metadata/action for token transaction fee
                      if (tokenId != null) {
                        const params: SaveTxActionParams = {
                          walletId: coreWallet.id,
                          tokenId,
                          txid: tx.txid,
                          savedAction,
                          assetAction: { ...assetAction, assetActionType: 'sell' }
                        }
                        await showUi.saveTxAction(params)
                      }
                    } catch (e: any) {
                      if (e.message === SendErrorNoTransaction) {
                        await showUi.showToast(lstrings.fiat_plugin_sell_failed_to_send_try_again)
                      } else if (e.message === SendErrorBackPressed) {
                        await showUi.showToast(lstrings.fiat_plugin_sell_cancelled)
                        await showUi.exitScene()
                      } else {
                        await showUi.showError(e)
                      }
                    } finally {
                      inPayment = false
                    }
                  }
                }
              })
            }
            await openWebView()
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
