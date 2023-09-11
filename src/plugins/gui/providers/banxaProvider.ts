// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { gt, lt } from 'biggystring'
import { asArray, asNumber, asObject, asString } from 'cleaners'
import URL from 'url-parse'

import { fetchInfo } from '../../../util/network'
import { consify, makeUuid } from '../../../util/utils'
import { FiatPaymentType } from '../fiatPluginTypes'
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
const providerId = 'banxa'
const storeId = 'banxa'
const partnerIcon = 'banxa.png'
const pluginDisplayName = 'Banxa'

const allowedPaymentTypes: { [Payment in FiatPaymentType]?: boolean } = { applepay: true, credit: true, googlepay: true }

const asBanxaApiKeys = asObject({
  partnerUrl: asString,
  apiKey: asString
})

const asBanxaCryptoCoin = asObject({
  coin_code: asString,
  blockchains: asArray(
    asObject({
      code: asString
    })
  )
})

const asBanxaCryptoCoins = asObject({
  data: asObject({
    coins: asArray(asBanxaCryptoCoin)
  })
})

const asBanxaFiat = asObject({
  fiat_code: asString
})

const asBanxaFiats = asObject({
  data: asObject({
    fiats: asArray(asBanxaFiat)
  })
})

const asBanxaTxLimit = asObject({
  fiat_code: asString,
  min: asString,
  max: asString
})

const asBanxaPaymentMethod = asObject({
  id: asNumber,
  paymentType: asString,
  name: asString,
  status: asString,
  type: asString,
  supported_fiat: asArray(asString),
  supported_coin: asArray(asString),
  transaction_limits: asArray(asBanxaTxLimit)
})

const asBanxaPricesResponse = asObject({
  data: asObject({
    spot_price: asString,
    prices: asArray(
      asObject({
        payment_method_id: asNumber,
        type: asString,
        spot_price_fee: asString,
        spot_price_including_fee: asString,
        coin_amount: asString,
        coin_code: asString,
        fiat_amount: asString,
        fiat_code: asString,
        fee_amount: asString,
        network_fee: asString
      })
    )
  })
})

const asBanxaQuote = asObject({
  // id: asString,
  // account_id: asString,
  // account_reference: asString,
  // order_type: asString,
  // fiat_code: asString,
  // fiat_amount: asNumber,
  // coin_code: asString,
  // coin_amount: asNumber,
  // wallet_address: asString,
  // blockchain: asObject({ code: asString }),
  // created_at: asString,
  checkout_url: asString
})

const asBanxaQuoteResponse = asObject({
  data: asObject({
    order: asBanxaQuote
  })
})

const asBanxaPaymentMethods = asObject({
  data: asObject({
    payment_methods: asArray(asBanxaPaymentMethod)
  })
})

interface BanxaPaymentMap {
  [fiatCode: string]: {
    [cryptoCode: string]: {
      [paymentType: string]: {
        id: number
        min: string
        max: string
      }
    }
  }
}

type BanxaTxLimit = ReturnType<typeof asBanxaTxLimit>
type BanxaCryptoCoin = ReturnType<typeof asBanxaCryptoCoin>
type BanxaPaymentMethods = ReturnType<typeof asBanxaPaymentMethods>

// https://support.banxa.com/en/support/solutions/articles/44002459218-supported-cryptocurrencies-and-blockchains
// This maps the Banxa blockchain codes to Edge pluginIds
const CURRENCY_PLUGINID_MAP = {
  'AVAX-C': 'avalanche',
  BCH: 'bitcoincash',
  BNB: 'binancechain',
  BSC: 'binancesmartchain',
  BTC: 'bitcoin',
  CELO: 'celo',
  DASH: 'dash',
  DGB: 'digibyte',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  EOS: 'eos',
  ETC: 'ethereumclassic',
  ETH: 'ethereum',
  FIL: 'filecoin',
  HBAR: 'hedera',
  LTC: 'litecoin',
  MATIC: 'polygon',
  QTUM: 'qtum',
  RVN: 'ravencoin',
  XLM: 'stellar',
  XRP: 'ripple',
  XTZ: 'tezos'
}

const asInfoCreateHmacResponse = asObject({ signature: asString })

const allowedCurrencyCodes: FiatProviderAssetMap = { fiat: {}, crypto: {} }
const banxaPaymentsMap: BanxaPaymentMap = {}

export const banxaProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      io: { store }
    } = params
    const { partnerUrl: url, apiKey } = asBanxaApiKeys(apiKeys)

    let banxaUsername = await store.getItem('username').catch(e => undefined)
    if (banxaUsername == null || banxaUsername === '') {
      banxaUsername = makeUuid()
      await store.setItem('username', banxaUsername)
    }

    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ paymentTypes }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true)) return { crypto: {}, fiat: {} }

        const promises = [
          banxaFetch({ method: 'GET', url, path: 'api/coins/buy', apiKey }).then(response => {
            const cryptoCurrencies = asBanxaCryptoCoins(response)
            for (const coin of cryptoCurrencies.data.coins) {
              for (const chain of coin.blockchains) {
                // @ts-expect-error
                const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
                if (currencyPluginId != null) {
                  addToAllowedCurrencies(currencyPluginId, coin.coin_code, coin)
                }
              }
            }
          }),

          banxaFetch({ method: 'GET', url, path: 'api/fiats/buy', apiKey }).then(response => {
            const fiatCurrencies = asBanxaFiats(response)
            for (const fiat of fiatCurrencies.data.fiats) {
              allowedCurrencyCodes.fiat['iso:' + fiat.fiat_code] = true
            }
          }),

          banxaFetch({ method: 'GET', url, path: 'api/payment-methods', apiKey }).then(response => {
            const banxaPayments = asBanxaPaymentMethods(response)
            buildPaymentsMap(banxaPayments, banxaPaymentsMap)
          })
        ]

        await Promise.all(promises)
        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { pluginId, regionCode, exchangeAmount, amountType, paymentTypes, fiatCurrencyCode, displayCurrencyCode, direction } = params
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        if (direction !== 'buy') throw new Error('Only buy supported by Banxa')

        // Check if the region, payment type, and fiat/crypto codes are supported
        const fiat = fiatCurrencyCode.replace('iso:', '')

        let banxaCrypto
        try {
          banxaCrypto = edgeToBanxaCrypto(pluginId, displayCurrencyCode)
        } catch (e: any) {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        const { banxaChain, banxaCoin } = banxaCrypto

        // TODO: Support returning multiple quotes for each payment type. Right now return quote for just
        // the first matchine payment type. Only need to return multiple quotes if the quote amounts are different per
        // payment type
        let paymentType
        try {
          paymentType = paymentTypes.find(t => banxaPaymentsMap[fiat][banxaCoin][t] != null)
        } catch (e: any) {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        if (paymentType == null) {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }
        const paymentObj = banxaPaymentsMap[fiat][banxaCoin][paymentType ?? ''] ?? {}
        if (paymentObj == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        let queryParams
        if (amountType === 'fiat') {
          if (gt(exchangeAmount, paymentObj.max)) {
            throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: parseFloat(paymentObj.max) })
          } else if (lt(exchangeAmount, paymentObj.min)) {
            throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: parseFloat(paymentObj.min) })
          }
          queryParams = {
            account_reference: banxaUsername,
            source: fiat,
            target: banxaCoin,
            source_amount: exchangeAmount,
            payment_method_id: paymentObj.id
          }
        } else {
          // if (gt(exchangeAmount, paymentObj.max)) {
          //   return { errorType: 'overLimit', errorAmount: parseFloat(paymentObj.max) }
          // } else if (lt(exchangeAmount, paymentObj.min)) {
          //   return { errorType: 'underLimit', errorAmount: parseFloat(paymentObj.min) }
          // }
          // body = JSON.stringify({
          //   account_reference: banxaUsername,
          //   source: fiat,
          //   target: banxaCoin,
          //   target_amount: exchangeAmount,
          //   payment_method_id: paymentObj.id
          // })
          throw new Error('Banxa only supports fiat -> crypto quotes')
        }

        const response = await banxaFetch({ method: 'GET', url, path: 'api/prices', apiKey, queryParams })
        const banxaPrices = asBanxaPricesResponse(response)
        const priceQuote = banxaPrices.data.prices[0]
        console.log('Got Banxa Quote:')
        consify(priceQuote)

        const chosenPaymentTypes: FiatPaymentType[] = []
        chosenPaymentTypes.push(paymentType)

        const paymentQuote: FiatProviderQuote = {
          providerId,
          regionCode,
          direction,
          paymentTypes: chosenPaymentTypes,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: priceQuote.fiat_amount,
          cryptoAmount: priceQuote.coin_amount,
          expirationDate: new Date(Date.now() + 50000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress()

            const bodyParams = {
              payment_method_id: paymentObj.id,
              account_reference: banxaUsername,
              source: fiat,
              target: banxaCoin,
              wallet_address: receiveAddress?.publicAddress,
              source_amount: exchangeAmount,
              // target_amount: targetAmount,
              blockchain: banxaChain,
              return_url_on_success: 'https://deep.edge.app' // TODO: fix
            }
            const response = await banxaFetch({ method: 'POST', url, path: 'api/orders', apiKey, bodyParams })
            const banxaQuote = asBanxaQuoteResponse(response)

            await showUi.openWebView({ url: banxaQuote.data.order.checkout_url })
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

const generateHmac = async (apiKey: string, data: string, nonce: string) => {
  const body = JSON.stringify({ data })
  const response = await fetchInfo(
    'v1/createHmac/banxa',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    },
    3000
  )
  const reply = await response.json()
  const { signature } = asInfoCreateHmacResponse(reply)

  return `${apiKey}:${signature}:${nonce}`
}

const banxaFetch = async (params: {
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

  const hmacpath = urlObj.href.replace(urlObj.origin + '/', '')

  const nonce = Date.now().toString()
  let hmacData = method + '\n' + hmacpath + '\n' + nonce
  hmacData += method === 'POST' ? '\n' + (body ?? '') : ''

  const hmac = await generateHmac(apiKey, hmacData, nonce)
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hmac}`
    },
    body
  }
  const response = await fetch(urlObj.href, options)
  const reply = await response.json()
  return reply
}

const addToAllowedCurrencies = (pluginId: string, currencyCode: string, coin: BanxaCryptoCoin) => {
  if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = {}
  allowedCurrencyCodes.crypto[pluginId][currencyCode] = coin
}

const typeMap = {
  WORLDPAYAPPLE: 'applepay',
  WORLDPAYGOOGLE: 'googlepay',
  WORLDPAYCREDIT: 'credit',
  CHECKOUTCREDIT: 'credit'
}

// While this could use Array.find(), this is an inner loop routine used hundreds of times interating over
// hundreds entries, so I'm opting for a more optimal for loop
const findLimit = (fiatCode: string, banxaLimits: BanxaTxLimit[]): BanxaTxLimit | undefined => {
  for (let i = 0; i < banxaLimits.length; i++) {
    const l = banxaLimits[i]
    if (l.fiat_code === fiatCode) {
      return l
    }
  }
}

const buildPaymentsMap = (banxaPayments: BanxaPaymentMethods, banxaPaymentsMap: BanxaPaymentMap): void => {
  const { payment_methods: methods } = banxaPayments.data
  for (const pm of methods) {
    // @ts-expect-error
    const pt = typeMap[pm.paymentType]
    if (pt != null) {
      for (const fiat of pm.supported_fiat) {
        if (banxaPaymentsMap[fiat] == null) {
          banxaPaymentsMap[fiat] = {}
        }
        for (const coin of pm.supported_coin) {
          if (banxaPaymentsMap[fiat][coin] == null) {
            banxaPaymentsMap[fiat][coin] = {}
          }

          const limit = findLimit(fiat, pm.transaction_limits)
          // Find the min/max from the
          if (limit == null) {
            console.error(`Missing limits for id:${pm.id} ${pm.paymentType} ${fiat}`)
          } else {
            // There shouldn't be an existing payment for this fiat/coin combo
            const newMap = {
              id: pm.id,
              min: limit.min,
              max: limit.max
            }
            if (banxaPaymentsMap[fiat][coin][pt] != null) {
              if (JSON.stringify(banxaPaymentsMap[fiat][coin][pt]) !== JSON.stringify(newMap)) {
                console.error(`Payment already exists with different values: ${fiat} ${coin} ${pt}`)
                continue
              }
            }
            banxaPaymentsMap[fiat][coin][pt] = newMap
          }
        }
      }
    }
  }
}

// Takes an EdgeTokenId and returns the corresponding Banxa chain code and coin code
const edgeToBanxaCrypto = (pluginId: string, displayCurrencyCode: string): { banxaChain: string; banxaCoin: string } => {
  const tokens = allowedCurrencyCodes.crypto[pluginId]
  if (tokens == null) throw new Error(`edgeToBanxaCrypto ${pluginId} not allowed`)
  const banxaCoin = asBanxaCryptoCoin(tokens[displayCurrencyCode])
  if (banxaCoin == null) throw new Error(`edgeToBanxaCrypto ${pluginId} ${displayCurrencyCode} not allowed`)
  for (const chain of banxaCoin.blockchains) {
    // @ts-expect-error
    const edgePluginId = CURRENCY_PLUGINID_MAP[chain.code]
    if (edgePluginId === pluginId) {
      return { banxaChain: chain.code, banxaCoin: banxaCoin.coin_code }
    }
  }
  throw new Error(`edgeToBanxaCrypto No matching pluginId ${pluginId}`)
}
