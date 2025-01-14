import { div, lt, mul } from 'biggystring'
import { asArray, asBoolean, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import URL from 'url-parse'

import { ENV } from '../../../env'
import { lstrings } from '../../../locales/strings'
import { FiatDirection, FiatPaymentType } from '../fiatPluginTypes'
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

// All OTC trades must at least meet this amount in fiat
const MIN_QUOTE_AMOUNT = '10000'

const providerId = 'kadoOtc'
const storeId = 'money.kado'
const partnerIcon = 'kado.png'
const pluginDisplayName = 'Kado OTC'
// const providerDisplayName = 'Kado'
// const supportEmail = 'support@kado.money'

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
  sui: 'sui',
  // cosmos: 'cosmos hub',
  bitcoin: 'bitcoin'
}

const CHAIN_ID_TO_PLUGIN_MAP: { [chainId: string]: string } = {}
for (const [pluginId, chainId] of Object.entries(PLUGIN_TO_CHAIN_ID_MAP)) {
  CHAIN_ID_TO_PLUGIN_MAP[chainId] = pluginId
}

const SUPPORTED_REGIONS: FiatProviderExactRegions = {
  US: {
    notStateProvinces: ['FL', 'LA', 'NY', 'TX']
  }
}

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    ach: true,
    applepay: true,
    colombiabank: true,
    credit: true,
    directtobank: true,
    fasterpayments: true,
    googlepay: true,
    iach: true,
    ideal: true,
    interac: true,
    iobank: true,
    mexicobank: true,
    payid: true,
    paypal: true,
    pix: true,
    pse: true,
    revolut: true,
    sepa: true,
    spei: true,
    turkishbank: true,
    wire: true
  },
  sell: {
    ach: true,
    applepay: true,
    colombiabank: true,
    credit: true,
    directtobank: true,
    fasterpayments: true,
    googlepay: true,
    iach: true,
    ideal: true,
    interac: true,
    iobank: true,
    mexicobank: true,
    payid: true,
    paypal: true,
    pix: true,
    pse: true,
    revolut: true,
    sepa: true,
    spei: true,
    turkishbank: true,
    wire: true
  }
}

const allowedBuyCurrencyCodes: FiatProviderAssetMap = {
  providerId,
  crypto: {},
  fiat: {}
}
const allowedSellCurrencyCodes: FiatProviderAssetMap = {
  providerId,
  crypto: {},
  fiat: {}
}
const allowedCountryCodes: { [code: string]: boolean } = { US: true }

/**
 * Cleaner for /v1/ramp/blockchains
 */

const asAssociatedAsset = asObject({
  symbol: asString,
  liveOnRamp: asOptional(asBoolean),
  address: asOptional(asString),
  isNative: asBoolean,
  rampProducts: asOptional(asArray(asValue('buy', 'sell')))
})

const asBlockchain = asObject({
  origin: asString,
  associatedAssets: asArray(asAssociatedAsset),
  liveOnRamp: asBoolean
})

// Define the main cleaner
const asBlockchains = asObject({
  success: asBoolean,
  data: asObject({
    blockchains: asArray(asBlockchain)
  })
})

/**
 * Cleaner for /v2/ramp/quote
 */

// Define cleaners for nested objects and properties
const asAmountCurrency = asObject({
  amount: asNumber,
  currency: asString
})

const asMinMaxValue = asObject({
  amount: asNumber,
  unit: asString
})

const asQuote = asObject({
  baseAmount: asAmountCurrency,
  totalFee: asAmountCurrency,
  receive: asObject({
    amount: asNumber,
    unitCount: asNumber
  }),
  minValue: asMinMaxValue,
  maxValue: asMinMaxValue
})

// Main cleaner for the JSON structure
const asQuoteResponse = asObject({
  success: asBoolean,
  message: asString,
  data: asObject({
    quote: asQuote
  })
})

const asApiKeys = asObject({
  apiKey: asString,
  apiUserEmail: asString
})

const asTokenOtherInfo = asObject({
  symbol: asString
})

/**
 * Cleaner for /v2/public/orders/{orderId}
 */

interface GetQuoteParams {
  transactionType: 'buy' | 'sell'
  fiatMethod: 'ach' | 'card' | 'wire'
  amount: number
  blockchain: string
  currency: string
  reverse: boolean
  asset: string
}

export const kadoOtcProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys } = params
    const { apiKey, apiUserEmail } = asApiKeys(apiKeys)

    const authToken = btoa(`${apiUserEmail}/token:${apiKey}`) // base64 encode this

    const instance: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        validateExactRegion(providerId, regionCode, SUPPORTED_REGIONS)
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({
            providerId,
            errorType: 'paymentUnsupported'
          })
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
          throw new FiatProviderError({
            providerId,
            errorType: 'paymentUnsupported'
          })
        }

        for (const blockchain of blockchains.data.blockchains) {
          const { liveOnRamp } = blockchain
          if (!liveOnRamp) continue
          const pluginId = CHAIN_ID_TO_PLUGIN_MAP[blockchain.origin]
          if (pluginId == null) continue
          allowedCurrencyCodes.crypto[pluginId] = []

          for (const asset of blockchain.associatedAssets) {
            const { isNative, address } = asset

            if (asset.rampProducts == null || !asset.rampProducts.includes(direction)) continue
            if (isNative) {
              allowedCurrencyCodes.crypto[pluginId].push({
                tokenId: null,
                otherInfo: { symbol: asset.symbol }
              })
              continue
            }

            if (address != null && address !== '0x0000000000000000000000000000000000000000') {
              const tokenId = await params.getTokenIdFromContract({
                pluginId,
                contractAddress: address
              })
              if (tokenId !== undefined) {
                allowedCurrencyCodes.crypto[pluginId].push({
                  tokenId,
                  otherInfo: { symbol: asset.symbol }
                })
              }
            }
          }
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        validateExactRegion(providerId, params.regionCode, SUPPORTED_REGIONS)

        const allowedCurrencyCodes = params.direction === 'buy' ? allowedBuyCurrencyCodes : allowedSellCurrencyCodes

        if (!allowedCountryCodes[params.regionCode.countryCode])
          throw new FiatProviderError({
            providerId,
            errorType: 'regionRestricted',
            displayCurrencyCode: params.displayCurrencyCode
          })

        if (!params.paymentTypes.some(paymentType => allowedPaymentTypes[params.direction][paymentType] === true))
          throw new FiatProviderError({
            providerId,
            errorType: 'paymentUnsupported'
          })

        const paymentType = params.paymentTypes[0]

        const allowedTokens = allowedCurrencyCodes.crypto[params.pluginId]
        const allowedToken = allowedTokens.find(t => t.tokenId === params.tokenId)
        if (allowedToken == null)
          throw new FiatProviderError({
            providerId,
            errorType: 'assetUnsupported'
          })
        const tokenOtherInfo = asTokenOtherInfo(allowedToken.otherInfo)

        const blockchain = PLUGIN_TO_CHAIN_ID_MAP[params.pluginId]

        // These parameters are only to get a quote exchange rate:
        const queryParams: GetQuoteParams = {
          // All OTC rates are quoted at a fixed volume amount
          amount: 10_000,
          asset: tokenOtherInfo.symbol,
          blockchain,
          currency: 'USD',
          fiatMethod: 'wire',
          reverse: false,
          transactionType: params.direction
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
        const quote = asQuoteResponse(result).data.quote

        let fiatAmount: string
        let cryptoAmount: string
        if (params.direction === 'buy') {
          if (params.amountType === 'fiat') {
            fiatAmount = params.exchangeAmount
            const scaleRatio = div(params.exchangeAmount, queryParams.amount, 18)
            cryptoAmount = mul(quote.receive.unitCount, scaleRatio)
          } else {
            cryptoAmount = params.exchangeAmount
            const exchangeRate = div(quote.receive.amount, quote.receive.unitCount, 18)
            fiatAmount = div(mul(params.exchangeAmount, exchangeRate), 1, 2)
          }
        } else {
          if (params.amountType === 'crypto') {
            cryptoAmount = params.exchangeAmount
            const scaleRatio = div(params.exchangeAmount, queryParams.amount, 18)
            fiatAmount = div(mul(quote.receive.amount, scaleRatio), 1, 2)
          } else {
            fiatAmount = params.exchangeAmount
            const exchangeRate = div(queryParams.amount, quote.receive.amount, 18)
            cryptoAmount = mul(params.exchangeAmount, exchangeRate)
          }
        }

        // Make sure the final quote amount is within the min/max limits
        if (lt(fiatAmount, MIN_QUOTE_AMOUNT))
          throw new FiatProviderError({
            providerId,
            errorType: 'underLimit',
            errorAmount: parseFloat(MIN_QUOTE_AMOUNT),
            displayCurrencyCode: 'USD'
          })

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode: params.regionCode,
          paymentTypes: params.paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: true,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          cryptoAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 60000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi } = approveParams

            // Do something to showUi to get the username  and email
            const userEmail = await showUi.emailForm({
              message: params.direction === 'buy' ? lstrings.otc_enter_email_to_buy : lstrings.otc_enter_email_to_sell
            })

            if (userEmail == null) {
              // User canceled the form scene (navigated back).
              // There is nothing left to do.
              return
            }

            const requestBody = {
              ticket: {
                subject: 'OTC Order Request',
                comment: {
                  body: `Requesting to ${params.direction} ${cryptoAmount} ${tokenOtherInfo.symbol} for ${fiatAmount} USD using ${paymentType}.`
                },
                requester: {
                  // We don't care about their name
                  // And we don't want to ask for their name to lower friction
                  name: userEmail,
                  email: userEmail
                }
              }
            }

            const response = await fetch('https://edgeapp.zendesk.com/api/v2/tickets.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${authToken}`
              },
              body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
              const text = await response.text()
              // Exit the form scene
              showUi.exitScene()
              throw new Error(`Error creating Zendesk ticket: ${text}`)
            }

            const result = await response.json()

            console.log('!@!', result)

            await showUi.confirmation({
              title: lstrings.otc_confirmation_title,
              message: lstrings.otc_confirmation_message
            })

            // Exit the confirmation scene
            showUi.exitScene()
            // Exit the form scene
            showUi.exitScene()
            // Exit the amount quote scene
            showUi.exitScene()
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      },
      otherMethods: null
    }
    return instance
  }
}
