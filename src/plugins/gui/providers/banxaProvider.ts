// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { gt, lt } from 'biggystring'
import { asArray, asMaybe, asNumber, asObject, asString, asValue } from 'cleaners'
import URL from 'url-parse'

import { fetchInfo } from '../../../util/network'
import { consify, makeUuid } from '../../../util/utils'
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
const providerId = 'banxa'
const storeId = 'banxa'
const partnerIcon = 'banxa.png'
const pluginDisplayName = 'Banxa'

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    applepay: true,
    credit: true,
    fasterpayments: true,
    googlepay: true,
    interac: true,
    iobank: true,
    payid: true,
    pix: true,
    sepa: false, // Leave this to Bity for now
    turkishbank: true
  },
  sell: {}
}

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

const asBanxaPaymentType = asValue(
  'CHECKOUTCREDIT',
  'CLEARJCNSELLFP',
  'CLEARJCNSELLSEPA',
  'CLEARJUNCTION',
  'CLEARJUNCTIONFP',
  'DCINTERAC',
  'DCINTERACSELL',
  'DIRECTCREDIT',
  'DLOCALPIX',
  'DLOCALZAIO',
  'MANUALPAYMENT',
  'MONOOVAPAYID',
  'WORLDPAYAPPLE',
  'WORLDPAYCREDIT',
  'WORLDPAYGOOGLE'
)

const asBanxaStatus = asValue('ACTIVE', 'INACTIVE')

const asBanxaPaymentMethod = asObject({
  id: asNumber,
  paymentType: asMaybe(asBanxaPaymentType),
  name: asString,
  status: asBanxaStatus,
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

interface BanxaPaymentIdLimit {
  id: number
  type: FiatPaymentType
  min: string
  max: string
}
interface BanxaPaymentMap {
  [fiatCode: string]: {
    [cryptoCode: string]: { [id: number]: BanxaPaymentIdLimit }
  }
}

type BanxaTxLimit = ReturnType<typeof asBanxaTxLimit>
type BanxaCryptoCoin = ReturnType<typeof asBanxaCryptoCoin>
type BanxaPaymentType = ReturnType<typeof asBanxaPaymentType>
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

const allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = { buy: { fiat: {}, crypto: {} }, sell: { fiat: {}, crypto: {} } }
const banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap> = { buy: {}, sell: {} }

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
      getSupportedAssets: async ({ direction, paymentTypes }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true)) return { crypto: {}, fiat: {} }

        const fiats = allowedCurrencyCodes[direction].fiat
        const cryptos = allowedCurrencyCodes[direction].fiat
        if (Object.keys(fiats).length > 0 && Object.keys(cryptos).length > 0) {
          return allowedCurrencyCodes[direction]
        }

        // XXX Hack. Banxa doesn't return any payment methods for sell unless the source asset is
        // specified. BTC is most supported so we add that for the query of sell payment methods
        let paymentMethodsPath
        if (direction === 'buy') {
          paymentMethodsPath = 'api/payment-methods'
        } else {
          paymentMethodsPath = 'api/payment-methods?source=BTC'
        }

        const promises = [
          banxaFetch({ method: 'GET', url, path: `api/coins/${direction}`, apiKey }).then(response => {
            const cryptoCurrencies = asBanxaCryptoCoins(response)
            for (const coin of cryptoCurrencies.data.coins) {
              for (const chain of coin.blockchains) {
                // @ts-expect-error
                const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
                if (currencyPluginId != null) {
                  addToAllowedCurrencies(currencyPluginId, direction, coin.coin_code, coin)
                }
              }
            }
          }),

          banxaFetch({ method: 'GET', url, path: `api/fiats/${direction}`, apiKey }).then(response => {
            const fiatCurrencies = asBanxaFiats(response)
            for (const fiat of fiatCurrencies.data.fiats) {
              allowedCurrencyCodes[direction].fiat['iso:' + fiat.fiat_code] = true
            }
          }),

          banxaFetch({ method: 'GET', url, path: paymentMethodsPath, apiKey }).then(response => {
            const banxaPayments = asBanxaPaymentMethods(response)
            buildPaymentsMap(banxaPayments, banxaPaymentsMap[direction])
          })
        ]

        await Promise.all(promises)
        return allowedCurrencyCodes[direction]
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { pluginId, regionCode, exchangeAmount, amountType, paymentTypes, fiatCurrencyCode, displayCurrencyCode, direction } = params
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        if (direction !== 'buy') throw new Error('Only buy supported by Banxa')

        // Check if the region, payment type, and fiat/crypto codes are supported
        const fiat = fiatCurrencyCode.replace('iso:', '')

        let banxaCrypto
        try {
          banxaCrypto = edgeToBanxaCrypto(pluginId, direction, displayCurrencyCode)
        } catch (e: any) {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        const { banxaChain, banxaCoin } = banxaCrypto

        // TODO: Support returning multiple quotes for each payment type. Right now return quote for just
        // the first matchine payment type. Only need to return multiple quotes if the quote amounts are different per
        // payment type
        let paymentObj: BanxaPaymentIdLimit | undefined
        let paymentType: FiatPaymentType | undefined
        let hasFetched = false
        while (true) {
          for (const pt of paymentTypes) {
            paymentObj = getPaymentIdLimit(direction, fiat, banxaCoin, pt)
            if (paymentObj != null) {
              paymentType = pt
              break
            }
          }

          // Success
          if (paymentObj != null && paymentType != null) {
            break
          }

          // If the user is buying, all the payment methods were already queried at getSupportedAssets
          if (direction === 'buy' || hasFetched) {
            throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
          } else {
            // Fetch the payment methods for this specific source crypto asset
            const pmResponse = await banxaFetch({ method: 'GET', url, path: `api/payment-methods?source=${banxaCoin}`, apiKey })
            const banxaPayments = asBanxaPaymentMethods(pmResponse)
            buildPaymentsMap(banxaPayments, banxaPaymentsMap.sell)
            hasFetched = true
          }
        }

        const checkMinMax = (amount: string, paymentIdLimit: BanxaPaymentIdLimit, displayCurrencyCode?: string) => {
          if (gt(amount, paymentIdLimit.max)) {
            throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: parseFloat(paymentIdLimit.max), displayCurrencyCode })
          } else if (lt(amount, paymentIdLimit.min)) {
            throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: parseFloat(paymentIdLimit.min), displayCurrencyCode })
          }
        }

        const queryParams: any = {
          account_reference: banxaUsername,
          payment_method_id: paymentObj.id
        }

        if (direction === 'buy') {
          queryParams.source = fiat
          queryParams.target = banxaCoin
          if (amountType === 'fiat') {
            queryParams.source_amount = exchangeAmount
            checkMinMax(exchangeAmount, paymentObj)
          } else {
            queryParams.target_amount = exchangeAmount
          }
        } else {
          queryParams.source = banxaCoin
          queryParams.target = fiat
          if (amountType === 'fiat') {
            queryParams.target_amount = exchangeAmount
            checkMinMax(exchangeAmount, paymentObj)
          } else {
            queryParams.source_amount = exchangeAmount
          }
        }

        const response = await banxaFetch({ method: 'GET', url, path: 'api/prices', apiKey, queryParams })
        const banxaPrices = asBanxaPricesResponse(response)
        const priceQuote = banxaPrices.data.prices[0]
        console.log('Got Banxa Quote:')
        consify(priceQuote)

        checkMinMax(priceQuote.fiat_amount, paymentObj, fiat)
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
              payment_method_id: paymentObj?.id ?? '',
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

            await showUi.openExternalWebView({ url: banxaQuote.data.order.checkout_url })
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

const addToAllowedCurrencies = (pluginId: string, direction: FiatDirection, currencyCode: string, coin: BanxaCryptoCoin) => {
  if (allowedCurrencyCodes[direction].crypto[pluginId] == null) allowedCurrencyCodes[direction].crypto[pluginId] = {}
  allowedCurrencyCodes[direction].crypto[pluginId][currencyCode] = coin
}

const typeMap: { [Payment in BanxaPaymentType]: FiatPaymentType } = {
  CHECKOUTCREDIT: 'credit',
  CLEARJCNSELLFP: 'fasterpayments',
  CLEARJCNSELLSEPA: 'sepa',
  CLEARJUNCTION: 'sepa',
  CLEARJUNCTIONFP: 'fasterpayments',
  DCINTERAC: 'interac',
  DCINTERACSELL: 'interac',
  DIRECTCREDIT: 'directtobank',
  DLOCALPIX: 'pix',
  DLOCALZAIO: 'iobank',
  MANUALPAYMENT: 'turkishbank',
  MONOOVAPAYID: 'payid',
  WORLDPAYAPPLE: 'applepay',
  WORLDPAYCREDIT: 'credit',
  WORLDPAYGOOGLE: 'googlepay'
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
    const { paymentType } = pm
    if (paymentType == null) continue
    const pt = typeMap[paymentType]
    if (pm.status !== 'ACTIVE') {
      continue
    }
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
            const newMap: BanxaPaymentIdLimit = {
              id: pm.id,
              min: limit.min,
              max: limit.max,
              type: pt
            }
            if (banxaPaymentsMap[fiat][coin][pm.id] != null) {
              if (JSON.stringify(banxaPaymentsMap[fiat][coin][pm.id]) !== JSON.stringify(newMap)) {
                console.error(`Payment already exists with different values: ${fiat} ${coin} ${pt}`)
                continue
              }
            }
            banxaPaymentsMap[fiat][coin][pm.id] = newMap
          }
        }
      }
    }
  }
}

const getPaymentIdLimit = (direction: FiatDirection, fiat: string, banxaCoin: string, type: FiatPaymentType): BanxaPaymentIdLimit | undefined => {
  try {
    const payments = banxaPaymentsMap[direction][fiat][banxaCoin]
    const paymentId = Object.values(payments).find(p => p.type === type)
    return paymentId
  } catch (e) {}
}

// Takes an EdgeTokenId and returns the corresponding Banxa chain code and coin code
const edgeToBanxaCrypto = (pluginId: string, direction: FiatDirection, displayCurrencyCode: string): { banxaChain: string; banxaCoin: string } => {
  const tokens = allowedCurrencyCodes[direction].crypto[pluginId]
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
