import { asArray, asMaybe, asObject, asString, asValue } from 'cleaners'
import { EdgeFetchOptions } from 'edge-core-js'
import URL from 'url-parse'

import { EdgeTokenId } from '../../../types/types'
import { makeUuid } from '../../../util/utils'
import { FiatDirection, FiatPaymentType } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderAssetMap,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'
const providerId = 'paybis'
const storeId = 'paybis'
const partnerIcon = 'paybis.png'
const pluginDisplayName = 'Paybis'

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    credit: true
  },
  sell: {}
}

const asApiKeys = asObject({
  apiKey: asString,
  partnerUrl: asString
})

const asPaymentMethodId = asValue('early-access-credit-card')

// To be used soon

// const asAmountCode = asObject({
//   amount: asString,
//   currencyCode: asString
// })
// const asPaymentMethod = asObject({
//   // paymentMethod: 'early-access-credit-card',
//   // displayName: 'Credit/Debit Card',
//   id: asMaybe(asPaymentMethodId),
//   // name: 'Credit/Debit Card',
//   // icon: 'https://front.sandbox.paybis.com/resources/money-services/credit-card.svg',
//   minAmount: asAmountCode,
//   maxAmount: asAmountCode
// })

// const asPaymentMethods = asObject({
//   data: asArray(asPaymentMethod)
// })

const asCurrencyAndCode = asObject({
  currency: asString,
  currencyCode: asString
})

const asPaymentMethodPair = asObject({
  from: asString,
  to: asArray(asCurrencyAndCode)
})

const asPaymentMethodPairs = asObject({
  name: asMaybe(asPaymentMethodId),
  // displayName: asString,
  pairs: asArray(asPaymentMethodPair)
})

const asPaybisPairs = asObject({
  data: asArray(asPaymentMethodPairs)
})

type PaymentMethodId = ReturnType<typeof asPaymentMethodId>
type PaybisPairs = ReturnType<typeof asPaybisPairs>

let paybisPairs: PaybisPairs | undefined

interface ExtendedTokenId extends EdgeTokenId {
  currencyCode?: string
}
const PAYBIS_TO_EDGE_CURRENCY_MAP: Record<string, ExtendedTokenId> = {
  // ADA: { pluginId: 'cardano' },
  BNB: { pluginId: 'binancechain' },
  BCH: { pluginId: 'bitcoincash' },
  BTC: { pluginId: 'bitcoin' },
  'BTC-TESTNET': { pluginId: 'bitcointestnet', currencyCode: 'TESTBTC' },
  DOGE: { pluginId: 'dogecoin' },
  LTC: { pluginId: 'litecoin' },
  DOT: { pluginId: 'polkadot' },
  'MATIC-POLYGON': { pluginId: 'polygon', currencyCode: 'MATIC' },
  SOL: { pluginId: 'solana' },
  TRX: { pluginId: 'tron' },
  XLM: { pluginId: 'stellar' },
  XRP: { pluginId: 'ripple' },
  XTZ: { pluginId: 'tezos' },
  USDT: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
  USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  SHIB: { pluginId: 'ethereum', tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  WBTC: { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
  LINK: { pluginId: 'ethereum', tokenId: '514910771af9ca656af840dff83e8264ecf986ca' },
  MKR: { pluginId: 'ethereum', tokenId: '9f8f72aa9304c8b593d555f12ef6589cc3a579a2' },
  AAVE: { pluginId: 'ethereum', tokenId: '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
  BAT: { pluginId: 'ethereum', tokenId: '0d8775f648430679a709e98d2b0cb6250d2887ef' },
  CRV: { pluginId: 'ethereum', tokenId: 'd533a949740bb3306d119cc777fa900ba034cd52' },
  COMP: { pluginId: 'ethereum', tokenId: 'c00e94cb662c3520282e6f5717214004a7f26888' },
  YFI: { pluginId: 'ethereum', tokenId: '0bc529c00c6401aef6d220be8c6ea1667f6ad93e' },
  KNC: { pluginId: 'ethereum', tokenId: 'defa4e8a7bcba345f687a2f1456f5edd9ce97202' },
  SUSHI: { pluginId: 'ethereum', tokenId: '6b3595068778dd592e39a122f4f5a5cf09c90fe2' },
  'USDT-TRC20': { pluginId: 'tron', tokenId: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', currencyCode: 'USDT' },
  BUSD: { pluginId: 'binancesmartchain', tokenId: 'e9e7cea3dedca5984780bafc599bd69add087d56' }
}

const PAYMENT_METHOD_MAP: { [Payment in PaymentMethodId]: FiatPaymentType } = {
  'early-access-credit-card': 'credit'
}

const allowedCurrencyCodes: Record<FiatDirection, { [F in FiatPaymentType]?: FiatProviderAssetMap }> = {
  buy: { credit: { fiat: {}, crypto: {} } },
  sell: { credit: { fiat: {}, crypto: {} } }
}
export const paybisProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      io: { store }
    } = params
    const { apiKey, partnerUrl: url } = asApiKeys(apiKeys)

    let username = await store.getItem('username').catch(e => undefined)
    if (username == null || username === '') {
      username = makeUuid()
      await store.setItem('username', username)
    }

    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        const paymentType = paymentTypes.find(paymentType => allowedPaymentTypes[direction][paymentType] === true)
        if (paymentType == null) return { crypto: {}, fiat: {} }

        const fiats = allowedCurrencyCodes[direction][paymentType]?.fiat
        const cryptos = allowedCurrencyCodes[direction][paymentType]?.crypto

        if (fiats != null && cryptos != null) {
          if (Object.keys(fiats).length > 0 && Object.keys(cryptos).length > 0) {
            const out = allowedCurrencyCodes[direction][paymentType]
            if (out != null) {
              return out
            }
          }
        }

        if (paybisPairs == null) {
          const promises = [
            paybisFetch({ method: 'GET', url, path: `v1/currency/pairs`, apiKey })
              .then(response => {
                paybisPairs = asPaybisPairs(response)
              })
              .catch(e => {
                console.error(String(e))
              })
          ]
          await Promise.all(promises)
        }

        if (paybisPairs != null) {
          for (const paymentMethodPairs of paybisPairs.data) {
            const { name, pairs } = paymentMethodPairs
            if (name == null) continue
            const edgePaymentType = PAYMENT_METHOD_MAP[name]
            if (edgePaymentType == null) continue
            for (const pair of pairs) {
              const { from, to } = pair

              // Add the fiat
              let paymentMethodObj = allowedCurrencyCodes.buy[edgePaymentType]
              if (paymentMethodObj == null) {
                paymentMethodObj = { crypto: {}, fiat: {} }
                allowedCurrencyCodes.buy[edgePaymentType] = paymentMethodObj
              }
              paymentMethodObj.fiat[`iso:${from}`] = true

              // Add the cryptos
              for (const code of to) {
                const edgeTokenId = PAYBIS_TO_EDGE_CURRENCY_MAP[code.currencyCode]
                if (edgeTokenId != null) {
                  const { pluginId: currencyPluginId } = edgeTokenId
                  let { currencyCode: ccode } = edgeTokenId

                  if (ccode == null) {
                    ccode = code.currencyCode
                  }
                  // If the edgeTokenId has a tokenId, use it. If not use the currencyCode.
                  // If no currencyCode, use the key of PAYBIS_TO_EDGE_CURRENCY_MAP
                  let tokenMap = paymentMethodObj.crypto[currencyPluginId]
                  if (tokenMap == null) {
                    tokenMap = {}
                    paymentMethodObj.crypto[currencyPluginId] = tokenMap
                  }
                  tokenMap[ccode] = true
                }
              }
            }
          }
        }

        const out = allowedCurrencyCodes[direction][paymentType] ?? { fiat: {}, crypto: {} }
        return out
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { regionCode, paymentTypes, fiatCurrencyCode, displayCurrencyCode, direction } = params

        return {
          providerId,
          partnerIcon: 'dummy.png',
          pluginDisplayName: 'Paybis',
          displayCurrencyCode,
          cryptoAmount: '1',
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount: '1',
          direction,
          regionCode,
          paymentTypes,
          approveQuote: async () => {},
          closeQuote: async () => {}
        }
      },
      otherMethods: null
    }
    return out
  }
}

const paybisFetch = async (params: {
  method: 'POST' | 'GET'
  url: string
  path: string
  apiKey: string
  bodyParams?: object
  queryParams?: object
}): Promise<string> => {
  const { method, url, path, apiKey, bodyParams, queryParams } = params
  const urlObj = new URL(url + '/' + path, true)
  const body = bodyParams != null ? JSON.stringify(bodyParams) : undefined

  if (method === 'GET' && typeof queryParams === 'object') {
    urlObj.set('query', queryParams)
  }

  const options: EdgeFetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  }
  if (body != null) {
    options.body = body
  }
  const response = await fetch(urlObj.href, options)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  const reply = await response.json()
  return reply
}
