import { eq, round } from 'biggystring'
import { asArray, asDate, asMaybe, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeFetchOptions, EdgeSpendInfo, JsonObject } from 'edge-core-js'
import URL from 'url-parse'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { locale } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { EdgeTokenId, StringMap } from '../../../types/types'
import { makeUuid } from '../../../util/utils'
import { SendErrorBackPressed, SendErrorNoTransaction } from '../fiatPlugin'
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
import { assert, isWalletTestnet } from '../pluginUtils'
import { NOT_SUCCESS_TOAST_HIDE_MS, RETURN_URL_FAIL, RETURN_URL_PAYMENT, RETURN_URL_SUCCESS } from './common'
const providerId = 'paybis'
const storeId = 'paybis'
const partnerIcon = 'paybis.png'
const pluginDisplayName = 'Paybis'

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    pix: true,
    spei: true,
    pse: true
  },
  sell: {
    columbiabank: true,
    credit: true,
    mexicobank: true,
    pix: true
  }
}

// https://widget.sandbox.paybis.com/?requestId={requestId}&successReturnURL= {urlencodedUrl}&failureReturnURL={urlendodedUrl}
// requestId<string>(format: uuid) successReturnURL<string>(urlencoded) failureReturnURL<string>(urlencoded)

const asApiKeys = asObject({
  apiKey: asString,
  partnerUrl: asString
})

const asPaymentMethodId = asValue(
  // 'method-id-credit-card',
  'method-id-credit-card-out',

  // Columbia
  'method-id_bridgerpay_directa24_pse',
  'method-id-bridgerpay_directa24_colombia_payout',

  // Mexico
  'method-id_bridgerpay_directa24_spei',
  'method-id-bridgerpay_directa24_mexico_payout',

  // Brazil
  'method-id_bridgerpay_directa24_pix',
  'method-id-bridgerpay_directa24_pix_payout'

  // Unused
  // 'method-id-bank-transfer-out',
  // 'method-id-bridgerpay_astropay_payout',
  // 'method-id-bridgerpay_directa24_brazil_payout',
  // 'method-id-bridgerpay_directa24_chile_payout',
  // 'method-id-bridgerpay_directa24_ecuador_payout',
  // 'method-id-bridgerpay_directa24_panama_payout',
  // 'method-id-bridgerpay_directa24_peru_payout',
)

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

const asPaybisBuyPairs = asObject({
  data: asArray(asPaymentMethodPairs)
})

const asSellPair = asObject({
  fromAssetId: asString,
  to: asArray(asString)
})

const asSellPaymentMethodPairs = asObject({
  name: asMaybe(asPaymentMethodId),
  // displayName: asString,
  pairs: asArray(asSellPair)
})

const asPaybisSellPairs = asObject({
  data: asArray(asSellPaymentMethodPairs)
})

const asAmountCurrency = asObject({
  amount: asString, // "0",
  currencyCode: asString // "BTC"
})

const asQuotePaymentMethod = asObject({
  id: asPaymentMethodId, // "early-access-credit-card",
  // "name": asString, // "Credit/Debit Card",
  amountTo: asAmountCurrency,
  amountFrom: asAmountCurrency,
  // "amountToEquivalent": asAmountCurrency,
  fees: asObject({
    networkFee: asAmountCurrency,
    serviceFee: asAmountCurrency,
    totalFee: asAmountCurrency
  }),
  expiration: asDate, // "2023-10-04T04:26:51+00:00",
  expiresAt: asDate // "2023-10-04T04:26:51+00:00"
})

const asQuotePaymentErrors = asObject({
  paymentMethod: asOptional(asPaymentMethodId), // "early-access-credit-card",
  payoutMethod: asOptional(asPaymentMethodId), // "early-access-credit-card",
  error: asObject({
    message: asString // "Minimum amount is 5.00 USD",
    // "message": asString // "Amount must be less than 20000.00 USD",
    // "code": asString, // "d20d4269-5e95-4234-9e4b-64e3279017b6"
  })
})

const asQuote = asObject({
  id: asString, // "4ddd2465-4713-40b3-84d2-9a08d7bdcd09",
  currencyCodeTo: asString, // "BTC",
  currencyCodeFrom: asString, // "USD",
  requestedAmount: asObject({
    amount: asString, // "1.00",
    currencyCode: asString // "USD"
  }),
  requestedAmountType: asValue('from', 'to'), // "from",
  paymentMethods: asOptional(asArray(asQuotePaymentMethod)),
  payoutMethods: asOptional(asArray(asQuotePaymentMethod)),
  paymentMethodErrors: asOptional(asArray(asQuotePaymentErrors)),
  payoutMethodErrors: asOptional(asArray(asQuotePaymentErrors))
})

const asPaymentDetails = asObject({
  invoice: asString,
  blockchain: asString,
  network: asString,
  depositAddress: asString,
  destinationTag: asOptional(asString),
  currencyCode: asString,
  amount: asString
})

type PaymentMethodId = ReturnType<typeof asPaymentMethodId>
type PaybisBuyPairs = ReturnType<typeof asPaybisBuyPairs>
type PaybisSellPairs = ReturnType<typeof asPaybisSellPairs>

interface InitializePairs {
  url: string
  apiKey: string
}

interface PaybisPairs {
  buy: PaybisBuyPairs | undefined
  sell: PaybisSellPairs | undefined
}

const paybisPairs: PaybisPairs = { buy: undefined, sell: undefined }

interface ExtendedTokenId extends EdgeTokenId {
  currencyCode?: string
}

const WIDGET_URL = 'https://widget.paybis.com'
const WIDGET_URL_SANDBOX = 'https://widget.sandbox.paybis.com'

const FIAT_DECIMALS = -2
const CRYPTO_DECIMALS = -8

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

const EDGE_TO_PAYBIS_CURRENCY_MAP: StringMap = Object.entries(PAYBIS_TO_EDGE_CURRENCY_MAP).reduce((prev, [paybisCc, edgeToken]) => {
  return { ...prev, [`${edgeToken.pluginId}_${edgeToken.tokenId ?? ''}`]: paybisCc }
}, {})

const PAYMENT_METHOD_MAP: { [Payment in PaymentMethodId]: FiatPaymentType } = {
  'method-id-credit-card-out': 'credit',

  // Columbia
  'method-id_bridgerpay_directa24_pse': 'pse',
  'method-id-bridgerpay_directa24_colombia_payout': 'columbiabank',

  // Mexico
  'method-id_bridgerpay_directa24_spei': 'spei',
  'method-id-bridgerpay_directa24_mexico_payout': 'mexicobank',

  // Brazil
  'method-id_bridgerpay_directa24_pix': 'pix',
  'method-id-bridgerpay_directa24_pix_payout': 'pix'
}

const REVERSE_PAYMENT_METHOD_MAP: Partial<{ [Payment in FiatPaymentType]: PaymentMethodId }> = {
  pix: 'method-id_bridgerpay_directa24_pix',
  pse: 'method-id_bridgerpay_directa24_pse',
  spei: 'method-id_bridgerpay_directa24_spei'
}

const SELL_REVERSE_PAYMENT_METHOD_MAP: Partial<{ [Payment in FiatPaymentType]: PaymentMethodId }> = {
  credit: 'method-id-credit-card-out',
  columbiabank: 'method-id-bridgerpay_directa24_colombia_payout',
  mexicobank: 'method-id-bridgerpay_directa24_mexico_payout',
  pix: 'method-id-bridgerpay_directa24_pix_payout'
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

    let partnerUserId = await store.getItem('partnerUserId').catch(e => undefined)
    if (partnerUserId == null || partnerUserId === '') {
      partnerUserId = makeUuid()
      await store.setItem('partnerUserId', partnerUserId)
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

        if (direction === 'buy') {
          await initializeBuyPairs({ url, apiKey })
        } else {
          await initializeSellPairs({ url, apiKey })
        }

        const out = allowedCurrencyCodes[direction][paymentType] ?? { fiat: {}, crypto: {} }
        return out
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const {
          amountType,
          exchangeAmount,
          regionCode,
          paymentTypes,
          pluginId: currencyPluginId,
          fiatCurrencyCode,
          displayCurrencyCode,
          direction,
          tokenId
        } = params
        const paymentType = paymentTypes.find(paymentType => allowedPaymentTypes[direction][paymentType] === true)
        if (paymentType == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const pairs = paybisPairs[direction]?.data
        if (pairs == null) {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        // Check if the region, payment type, and fiat/crypto codes are supported
        const fiat = fiatCurrencyCode.replace('iso:', '')

        const paymentMethod = direction === 'buy' ? REVERSE_PAYMENT_METHOD_MAP[paymentType] : SELL_REVERSE_PAYMENT_METHOD_MAP[paymentType]
        const paybisCc = EDGE_TO_PAYBIS_CURRENCY_MAP[`${currencyPluginId}_${tokenId ?? ''}`]

        if (paymentMethod == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        let currencyCodeFrom
        let currencyCodeTo
        let directionChange: 'from' | 'to'
        let amount

        if (direction === 'buy') {
          currencyCodeFrom = fiat
          currencyCodeTo = paybisCc
          if (amountType === 'fiat') {
            directionChange = 'from'
            amount = round(exchangeAmount, FIAT_DECIMALS)
          } else {
            directionChange = 'to'
            amount = round(exchangeAmount, CRYPTO_DECIMALS)
          }
        } else {
          currencyCodeFrom = paybisCc
          currencyCodeTo = fiat
          if (amountType === 'fiat') {
            amount = round(exchangeAmount, FIAT_DECIMALS)
            directionChange = 'to'
          } else {
            amount = round(exchangeAmount, CRYPTO_DECIMALS)
            directionChange = 'from'
          }
        }
        const bodyParams = {
          currencyCodeFrom,
          amount,
          currencyCodeTo,
          directionChange,
          isReceivedAmount: directionChange === 'to',
          paymentMethod: direction === 'buy' ? paymentMethod : undefined,
          payoutMethod: direction === 'sell' ? paymentMethod : undefined
        }
        const response = await paybisFetch({ method: 'POST', url, path: 'v2/quote', apiKey, bodyParams })
        const { id: quoteId, paymentMethods, paymentMethodErrors, payoutMethods, payoutMethodErrors } = asQuote(response)

        const pmErrors = paymentMethodErrors ?? payoutMethodErrors
        if (pmErrors != null) {
          let lastError
          for (const e of pmErrors) {
            lastError = e
            const maxMatch = e.error.message.match(/^Amount must be less than (\d+\.\d+) ([A-Z]+)/)
            const minMatch = e.error.message.match(/^Minimum amount is (\d+\.\d+) ([A-Z]+)/)
            if (maxMatch != null) {
              throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: Number(maxMatch[1]), displayCurrencyCode: maxMatch[2] })
            } else if (minMatch != null) {
              throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: Number(minMatch[1]), displayCurrencyCode: minMatch[2] })
            }
          }
          throw new Error(lastError?.error.message ?? 'Paybis Unknown paymentMethodError')
        }

        let pmQuote
        if (direction === 'buy' && paymentMethods?.length === 1) {
          pmQuote = paymentMethods[0]
        } else if (direction === 'sell' && payoutMethods?.length === 1) {
          pmQuote = payoutMethods[0]
        } else {
          throw new Error('Invalid number of quoted payment methods')
        }

        const { id: paymentMethodId, amountFrom, amountTo } = pmQuote

        let cryptoAmount: string
        let fiatAmount: string

        if (directionChange === 'from') {
          // Sanity check the quote
          assert(eq(amount, amountFrom.amount), 'Quote not equal to requested from amount')
        } else {
          assert(eq(amount, amountTo.amount), 'Quote not equal to requested to amount')
        }

        if (direction === 'buy') {
          fiatAmount = amountFrom.amount
          cryptoAmount = amountTo.amount
        } else {
          fiatAmount = amountTo.amount
          cryptoAmount = amountFrom.amount
        }

        return {
          providerId,
          partnerIcon: 'dummy.png',
          pluginDisplayName: 'Paybis',
          displayCurrencyCode,
          cryptoAmount,
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount,
          direction,
          regionCode,
          paymentTypes,
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { coreWallet, showUi } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress()

            let bodyParams
            if (direction === 'buy') {
              bodyParams = {
                cryptoWalletAddress: {
                  currencyCode: paybisCc,
                  address: receiveAddress.segwitAddress ?? receiveAddress.publicAddress
                },
                partnerUserId,
                locale: locale.localeIdentifier.slice(0, 2),
                passwordless: false,
                trustedKyc: false,
                quoteId,
                flow: 'buyCrypto',
                paymentMethod: paymentMethodId
              }
            } else {
              bodyParams = {
                cryptoPaymentMethod: 'partner_controlled_with_redirect',
                partnerUserId,
                locale: locale.localeIdentifier.slice(0, 2),
                passwordless: false,
                trustedKyc: false,
                quoteId,
                flow: 'sellCrypto',
                depositCallbackUrl: RETURN_URL_PAYMENT,
                paymentMethod: paymentMethodId
              }
            }

            const response = await paybisFetch({ method: 'POST', url, path: 'v2/request', apiKey, bodyParams })
            const { requestId } = response

            const widgetUrl = isWalletTestnet(coreWallet) ? WIDGET_URL_SANDBOX : WIDGET_URL
            if (direction === 'buy') {
              await showUi.openExternalWebView({
                url: `${widgetUrl}?requestId=${requestId}`
              })
              return
            }

            const successReturnURL = encodeURI(RETURN_URL_SUCCESS)
            const failureReturnURL = encodeURI(RETURN_URL_FAIL)
            const webviewUrl = `${widgetUrl}?requestId=${requestId}&successReturnURL=${successReturnURL}&failureReturnURL=${failureReturnURL}`
            console.log(`webviewUrl: ${webviewUrl}`)
            let inPayment = false

            const openWebView = async () => {
              await showUi.openWebView({
                url: webviewUrl,
                onUrlChange: async newUrl => {
                  console.log(`*** onUrlChange: ${newUrl}`)
                  if (newUrl.startsWith(RETURN_URL_FAIL)) {
                    await showUi.exitScene()
                    await showUi.showToast(lstrings.fiat_plugin_sell_failed_try_again, NOT_SUCCESS_TOAST_HIDE_MS)
                  } else if (newUrl.startsWith(RETURN_URL_PAYMENT)) {
                    if (inPayment) return
                    inPayment = true
                    try {
                      const payDetails = await paybisFetch({ method: 'GET', url, path: `v2/request/${requestId}/payment-details`, apiKey })
                      const { amount, currencyCode: pbCurrencyCode, invoice, network, depositAddress, destinationTag } = asPaymentDetails(payDetails)
                      const { pluginId, tokenId } = PAYBIS_TO_EDGE_CURRENCY_MAP[pbCurrencyCode]

                      console.log(`Creating Paybis payment`)
                      console.log(`  amount: ${amount}`)
                      console.log(`  pbCurrencyCode: ${pbCurrencyCode}`)
                      console.log(`  network: ${network}`)
                      console.log(`  pluginId: ${pluginId}`)
                      console.log(`  tokenId: ${tokenId}`)
                      const nativeAmount = await coreWallet.denominationToNative(amount, displayCurrencyCode)

                      // Launch the SendScene to make payment
                      const spendInfo: EdgeSpendInfo = {
                        spendTargets: [
                          {
                            nativeAmount,
                            publicAddress: depositAddress
                          }
                        ]
                      }

                      if (destinationTag != null) {
                        spendInfo.memos = [
                          {
                            type: 'text',
                            value: destinationTag,
                            hidden: true
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
                      await showUi.send(sendParams)
                      await showUi.trackConversion('Sell_Success', {
                        destCurrencyCode: fiatCurrencyCode,
                        destExchangeAmount: fiatAmount,
                        sourceCurrencyCode: displayCurrencyCode,
                        sourceExchangeAmount: amount,
                        sourcePluginId: coreWallet.currencyInfo.pluginId,
                        pluginId: providerId,
                        orderId: invoice
                      })

                      // Route back to the original URL to show Paybis confirmation screen
                      await showUi.exitScene()
                      await openWebView()
                    } catch (e: any) {
                      await showUi.exitScene()
                      // Reopen the webivew on the Paybis payment screen
                      await openWebView()
                      if (e.message === SendErrorNoTransaction) {
                        await showUi.showToast(lstrings.fiat_plugin_sell_failed_to_send_try_again, NOT_SUCCESS_TOAST_HIDE_MS)
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
}): Promise<JsonObject> => {
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

const initializeBuyPairs = async ({ url, apiKey }: InitializePairs): Promise<void> => {
  if (paybisPairs.buy == null) {
    const promises = [
      paybisFetch({ method: 'GET', url, path: `v1/currency/pairs`, apiKey })
        .then(response => {
          paybisPairs.buy = asPaybisBuyPairs(response)
        })
        .catch(e => {
          console.error(String(e))
        })
    ]
    await Promise.all(promises)
  }

  if (paybisPairs.buy != null) {
    for (const paymentMethodPairs of paybisPairs.buy.data) {
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
}

const initializeSellPairs = async ({ url, apiKey }: InitializePairs): Promise<void> => {
  if (paybisPairs.sell == null) {
    const promises = [
      paybisFetch({ method: 'GET', url, path: `v2/currency/pairs/sell-crypto`, apiKey })
        .then(response => {
          paybisPairs.sell = asPaybisSellPairs(response)
        })
        .catch(e => {
          console.error(String(e))
        })
    ]
    await Promise.all(promises)
  }

  if (paybisPairs.sell != null) {
    for (const paymentMethodPairs of paybisPairs.sell.data) {
      const { name, pairs } = paymentMethodPairs
      if (name == null) continue
      const edgePaymentType = PAYMENT_METHOD_MAP[name]
      if (edgePaymentType == null) continue
      for (const pair of pairs) {
        const { fromAssetId, to } = pair

        let paymentMethodObj = allowedCurrencyCodes.sell[edgePaymentType]
        if (paymentMethodObj == null) {
          paymentMethodObj = { crypto: {}, fiat: {} }
          allowedCurrencyCodes.sell[edgePaymentType] = paymentMethodObj
        }

        const edgeTokenId = PAYBIS_TO_EDGE_CURRENCY_MAP[fromAssetId]
        if (edgeTokenId == null) continue
        const { pluginId: currencyPluginId } = edgeTokenId
        let { currencyCode: ccode } = edgeTokenId
        if (ccode == null) {
          ccode = fromAssetId
        }

        // If the edgeTokenId has a tokenId, use it. If not use the currencyCode.
        // If no currencyCode, use the key of PAYBIS_TO_EDGE_CURRENCY_MAP
        let tokenMap = paymentMethodObj.crypto[currencyPluginId]
        if (tokenMap == null) {
          tokenMap = {}
          paymentMethodObj.crypto[currencyPluginId] = tokenMap
        }
        tokenMap[ccode] = true

        for (const fiat of to) {
          paymentMethodObj.fiat[`iso:${fiat}`] = true
        }
      }
    }
  }
}
