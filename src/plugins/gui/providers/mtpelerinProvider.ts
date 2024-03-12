import { asNumber, asObject, asString } from 'cleaners'

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
const providerId = 'mtpelerin'
const storeId = 'com.mtpelerin'
const partnerIcon = 'mtpelerin.png'
const pluginDisplayName = 'Mt Pelerin'
// const providerDisplayName = pluginDisplayName
// const supportEmail = 'support@mtpelerin.com'

const urls = {
  api: {
    prod: 'https://api.mtpelerin.com',
    test: ''
  },
  widget: {
    prod: '',
    test: ''
  }
}

const MODE = 'prod'

const PLUGIN_TO_CHAIN_ID_MAP: { [pluginId: string]: string } = {
  arbitrum: 'arbitrum_mainnet',
  avalanche: 'avalanche_mainnet',
  binancesmartchain: 'bsc_mainnet',
  bitcoin: 'bitcoin_mainnet',
  ethereum: 'mainnet',
  optimism: 'optimism_mainnet',
  polygon: 'matic_mainnet',
  rsk: 'rsk_mainnet',
  tezos: 'tezos_mainnet',
  zksync: 'zksync_mainnet'
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
    sepa: true
  },
  sell: {
    sepa: true
  }
}

const allAllowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = {
  buy: {
    providerId,
    requiredAmountType: 'fiat',
    crypto: {},
    fiat: {
      CHF: true,
      DKK: true,
      EUR: true,
      GBP: true,
      HKD: true,
      JPY: true,
      NOK: true,
      NZD: true,
      SEK: true,
      SGD: true,
      USD: true,
      ZAR: true
    }
  },
  sell: {
    providerId,
    requiredAmountType: 'crypto',
    crypto: {},
    fiat: {
      CHF: true,
      DKK: true,
      EUR: true,
      GBP: true,
      HKD: true,
      JPY: true,
      NOK: true,
      NZD: true,
      SEK: true,
      SGD: true,
      USD: true,
      ZAR: true
    }
  }
}
const allowedCountryCodes: { [code: string]: boolean } = {
  AL: true, // Albania
  AD: true, // Andorra
  AM: true, // Armenia
  AT: true, // Austria
  AZ: true, // Azerbaijan
  BY: true, // Belarus
  BE: true, // Belgium
  BA: true, // Bosnia and Herzegovina
  BG: true, // Bulgaria
  HR: true, // Croatia
  CY: true, // Cyprus
  CZ: true, // Czech Republic
  DK: true, // Denmark
  EE: true, // Estonia
  FI: true, // Finland
  FR: true, // France
  GE: true, // Georgia
  DE: true, // Germany
  GR: true, // Greece
  HU: true, // Hungary
  IS: true, // Iceland
  IE: true, // Ireland
  IT: true, // Italy
  KZ: true, // Kazakhstan
  LV: true, // Latvia
  LI: true, // Liechtenstein
  LT: true, // Lithuania
  LU: true, // Luxembourg
  MT: true, // Malta
  MD: true, // Moldova
  MC: true, // Monaco
  ME: true, // Montenegro
  NL: true, // Netherlands
  MK: true, // North Macedonia (formerly Macedonia)
  NO: true, // Norway
  PL: true, // Poland
  PT: true, // Portugal
  RO: true, // Romania
  RU: true, // Russia
  SM: true, // San Marino
  RS: true, // Serbia
  SK: true, // Slovakia
  SI: true, // Slovenia
  ES: true, // Spain
  SE: true, // Sweden
  CH: true, // Switzerland
  TR: true, // Turkey
  UA: true, // Ukraine
  GB: true, // United Kingdom
  VA: true // Vatican City
}

/**
 * Cleaner for https://api.mtpelerin.com/currencies/tokens
 */

// Define a cleaner for the individual token entry
const asTokenEntry = asObject({
  symbol: asString,
  network: asString,
  // decimals: asNumber,
  address: asString
  // isStable: asBoolean,
  // networkFee: asOptional(asNumber),
  // forceNetworkFee: asOptional(asBoolean)
})

// Define a cleaner for the entire JSON structure
const asTokenList = asObject(asTokenEntry)

const asTokenOtherInfo = asObject({
  address: asString,
  symbol: asString
})

// Define a cleaner for the 'fees' object
const asFees = asObject({
  networkFee: asString, // Assuming network fee can be a string representation of a number
  fixFee: asNumber
})

// Define the main cleaner for the entire JSON structure
const asQuoteResponse = asObject({
  fees: asFees,
  sourceCurrency: asString,
  destCurrency: asString,
  sourceNetwork: asString,
  destNetwork: asString,
  sourceAmount: asNumber,
  destAmount: asString // Assuming dest amount can be a string representation of a number
})

interface GetQuoteParams {
  sourceCurrency: string
  sourceAmount: number
  sourceNetwork: string
  destCurrency: string
  destNetwork: string
  isCardPayment: false
}

export const mtpelerinProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    // const { apiKey } = asStandardApiKeys(params.apiKeys)
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        const allowedCurrencyCodes = allAllowedCurrencyCodes[direction]

        if (Object.keys(allowedCurrencyCodes.crypto).length > 0) {
          return allowedCurrencyCodes
        }

        const response = await fetch(`${urls.api[MODE]}/currencies/tokens`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching My Pelerin currencies: ${text}`)
        }
        const result = await response.json()

        const tokenList = asTokenList(result)

        for (const token of Object.values(tokenList)) {
          const { address, network, symbol } = token
          const pluginId = CHAIN_ID_TO_PLUGIN_MAP[network]
          if (pluginId == null) continue
          if (allowedCurrencyCodes.crypto[pluginId] == null) {
            allowedCurrencyCodes.crypto[pluginId] = []
          }
          const tokens = allowedCurrencyCodes.crypto[pluginId]

          // Check if gas token (ie ETH, BTC)
          if (address.includes('0000000000000000000000000000000000000000')) {
            tokens.push({ tokenId: null, otherInfo: { address, symbol } })
            continue
          }

          // For EVM tokens only, lowercase and remove 0x
          const tokenId = address.toLowerCase().replace('0x', '')
          tokens.push({ tokenId, otherInfo: { address, symbol } })
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { amountType, direction, regionCode, exchangeAmount, fiatCurrencyCode, paymentTypes, pluginId, displayCurrencyCode, tokenId } = params
        if (direction === 'buy' && amountType !== 'fiat') {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }
        if (direction === 'sell' && amountType !== 'crypto') {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        const allowedCurrencyCodes = allAllowedCurrencyCodes[direction]

        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const tokens = allowedCurrencyCodes.crypto[pluginId]
        const token = tokens.find(t => t.tokenId === tokenId)
        if (token == null) throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        const { symbol } = asTokenOtherInfo(token.otherInfo)
        const network = PLUGIN_TO_CHAIN_ID_MAP[pluginId]

        // Query for a quote
        let getQuoteParams: GetQuoteParams
        const fiatCode = fiatCurrencyCode.replace('iso:', '')

        if (direction === 'buy') {
          if (amountType === 'fiat') {
            getQuoteParams = {
              sourceAmount: Number(exchangeAmount),
              sourceCurrency: fiatCode,
              sourceNetwork: 'fiat',
              destCurrency: symbol,
              destNetwork: network,
              isCardPayment: false
            }
          } else {
            throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
          }
        } else {
          if (amountType === 'crypto') {
            getQuoteParams = {
              sourceAmount: Number(exchangeAmount),
              sourceCurrency: symbol,
              sourceNetwork: network,
              destCurrency: fiatCode,
              destNetwork: 'fiat',
              isCardPayment: false
            }
          } else {
            throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
          }
        }

        const response = await fetch(`${urls.api[MODE]}/currency_rates/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(getQuoteParams)
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching Mt Pelerin quote: ${text}`)
        }
        const result = await response.json()
        const quote = asQuoteResponse(result)

        const { destAmount } = quote

        let fiatAmount: string
        let cryptoAmount: string
        if (direction === 'buy') {
          cryptoAmount = destAmount
          fiatAmount = exchangeAmount
        } else {
          cryptoAmount = exchangeAmount
          fiatAmount = destAmount
        }

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
            // TODO: execute quote via webview
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
