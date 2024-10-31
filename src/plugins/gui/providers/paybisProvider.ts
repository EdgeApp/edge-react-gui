import { eq, lte, mul, round } from 'biggystring'
import { asArray, asBoolean, asDate, asMaybe, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeAssetAction, EdgeFetchOptions, EdgeSpendInfo, EdgeTxActionFiat, JsonObject } from 'edge-core-js'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { locale } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { EdgeAsset, StringMap } from '../../../types/types'
import { sha512HashAndSign } from '../../../util/crypto'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { removeIsoPrefix } from '../../../util/utils'
import { SendErrorBackPressed, SendErrorNoTransaction } from '../fiatPlugin'
import { FiatDirection, FiatPaymentType, FiatPluginUi, SaveTxActionParams } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote,
  FiatProviderSupportedRegions
} from '../fiatProviderTypes'
import { assert, isWalletTestnet } from '../pluginUtils'
import { addTokenToArray } from '../util/providerUtils'
import { NOT_SUCCESS_TOAST_HIDE_MS, RETURN_URL_FAIL, RETURN_URL_PAYMENT, RETURN_URL_SUCCESS, validateRegion } from './common'
const providerId = 'paybis'
const storeId = 'paybis'
const partnerIcon = 'paybis.png'
const pluginDisplayName = 'Paybis'
const providerDisplayName = pluginDisplayName
const supportEmail = 'support@paybis.com'

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    applepay: true,
    credit: true,
    googlepay: true,
    pix: true,
    pse: true,
    revolut: true,
    spei: true
  },
  sell: {
    colombiabank: true,
    credit: true,
    mexicobank: true,
    pix: true
  }
}

// https://widget.sandbox.paybis.com/?requestId={requestId}&successReturnURL= {urlencodedUrl}&failureReturnURL={urlendodedUrl}
// requestId<string>(format: uuid) successReturnURL<string>(urlencoded) failureReturnURL<string>(urlencoded)

const asApiKeys = asObject({
  apiKey: asString,
  partnerUrl: asString,
  privateKeyB64: asString
})

const asPaymentMethodId = asValue(
  'method-id-credit-card',
  'method-id-credit-card-out',
  'method-id_bridgerpay_revolutpay',

  // XXX Hack. Fake payment methods for googlepay/applepay
  'fake-id-googlepay',
  'fake-id-applepay',

  // Colombia
  'method-id_bridgerpay_directa24_pse',
  'method-id_bridgerpay_directa24_colombia_payout',

  // Mexico
  'method-id_bridgerpay_directa24_spei',
  'method-id_bridgerpay_directa24_mexico_payout',

  // Brazil
  'method-id_bridgerpay_directa24_pix',
  'method-id_bridgerpay_directa24_pix_payout'

  // Unused
  // 'method-id-bank-transfer-out',
  // 'method-id_bridgerpay_astropay_payout',
  // 'method-id_bridgerpay_directa24_brazil_payout',
  // 'method-id_bridgerpay_directa24_chile_payout',
  // 'method-id_bridgerpay_directa24_ecuador_payout',
  // 'method-id_bridgerpay_directa24_panama_payout',
  // 'method-id_bridgerpay_directa24_peru_payout',
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
  assetId: asString,
  // invoice: asString,
  blockchain: asString,
  network: asString,
  depositAddress: asString,
  destinationTag: asOptional(asString),
  currencyCode: asString,
  amount: asString
})

const asPublicRequestResponse = asObject({
  requestId: asString,
  oneTimeToken: asOptional(asString)
})

const asUserStatus = asObject({
  hasTransactions: asBoolean
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

interface ExtendedTokenId extends EdgeAsset {
  currencyCode?: string
}

const WIDGET_URL = 'https://widget.paybis.com'
const WIDGET_URL_SANDBOX = 'https://widget.sandbox.paybis.com'

const FIAT_DECIMALS = -2
const CRYPTO_DECIMALS = -8

const PAYBIS_TO_EDGE_CURRENCY_MAP: Record<string, ExtendedTokenId> = {
  AAVE: { pluginId: 'ethereum', tokenId: '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
  ADA: { pluginId: 'cardano', tokenId: null },
  BAT: { pluginId: 'ethereum', tokenId: '0d8775f648430679a709e98d2b0cb6250d2887ef' },
  BCH: { pluginId: 'bitcoincash', tokenId: null },
  BNB: { pluginId: 'binancechain', tokenId: null },
  BTC: { pluginId: 'bitcoin', tokenId: null },
  'BTC-TESTNET': { currencyCode: 'TESTBTC', pluginId: 'bitcointestnet', tokenId: null },
  BUSD: { pluginId: 'binancesmartchain', tokenId: 'e9e7cea3dedca5984780bafc599bd69add087d56' },
  COMP: { pluginId: 'ethereum', tokenId: 'c00e94cb662c3520282e6f5717214004a7f26888' },
  CRV: { pluginId: 'ethereum', tokenId: 'd533a949740bb3306d119cc777fa900ba034cd52' },
  DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
  DOGE: { pluginId: 'dogecoin', tokenId: null },
  DOT: { pluginId: 'polkadot', tokenId: null },
  ETH: { pluginId: 'ethereum', tokenId: null },
  KNC: { pluginId: 'ethereum', tokenId: 'defa4e8a7bcba345f687a2f1456f5edd9ce97202' },
  LINK: { pluginId: 'ethereum', tokenId: '514910771af9ca656af840dff83e8264ecf986ca' },
  LTC: { pluginId: 'litecoin', tokenId: null },
  MKR: { pluginId: 'ethereum', tokenId: '9f8f72aa9304c8b593d555f12ef6589cc3a579a2' },
  POL: { currencyCode: 'POL', pluginId: 'polygon', tokenId: null },
  SHIB: { pluginId: 'ethereum', tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  SOL: { pluginId: 'solana', tokenId: null },
  SUSHI: { pluginId: 'ethereum', tokenId: '6b3595068778dd592e39a122f4f5a5cf09c90fe2' },
  TON: { pluginId: 'ton', tokenId: null },
  TRX: { pluginId: 'tron', tokenId: null },
  USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  USDT: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
  'USDT-TRC20': { currencyCode: 'USDT', pluginId: 'tron', tokenId: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
  WBTC: { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  XLM: { pluginId: 'stellar', tokenId: null },
  XRP: { pluginId: 'ripple', tokenId: null },
  XTZ: { pluginId: 'tezos', tokenId: null },
  YFI: { pluginId: 'ethereum', tokenId: '0bc529c00c6401aef6d220be8c6ea1667f6ad93e' }
}

const EDGE_TO_PAYBIS_CURRENCY_MAP: StringMap = Object.entries(PAYBIS_TO_EDGE_CURRENCY_MAP).reduce((prev, [paybisCc, edgeToken]) => {
  return { ...prev, [`${edgeToken.pluginId}_${edgeToken.tokenId ?? ''}`]: paybisCc }
}, {})

const PAYMENT_METHOD_MAP: { [Payment in PaymentMethodId]: FiatPaymentType } = {
  'method-id-credit-card': 'credit',
  'method-id-credit-card-out': 'credit',
  'method-id_bridgerpay_revolutpay': 'revolut',

  // XXX Hack. Fake payment methods for googlepay/applepay
  'fake-id-googlepay': 'googlepay',
  'fake-id-applepay': 'applepay',

  // Colombia
  'method-id_bridgerpay_directa24_pse': 'pse',
  'method-id_bridgerpay_directa24_colombia_payout': 'colombiabank',

  // Mexico
  'method-id_bridgerpay_directa24_spei': 'spei',
  'method-id_bridgerpay_directa24_mexico_payout': 'mexicobank',

  // Brazil
  'method-id_bridgerpay_directa24_pix': 'pix',
  'method-id_bridgerpay_directa24_pix_payout': 'pix'
}

const REVERSE_PAYMENT_METHOD_MAP: Partial<{ [Payment in FiatPaymentType]: PaymentMethodId }> = {
  applepay: 'method-id-credit-card',
  credit: 'method-id-credit-card',
  googlepay: 'method-id-credit-card',
  pix: 'method-id_bridgerpay_directa24_pix',
  pse: 'method-id_bridgerpay_directa24_pse',
  revolut: 'method-id_bridgerpay_revolutpay',
  spei: 'method-id_bridgerpay_directa24_spei'
}

const SELL_REVERSE_PAYMENT_METHOD_MAP: Partial<{ [Payment in FiatPaymentType]: PaymentMethodId }> = {
  credit: 'method-id-credit-card-out',
  colombiabank: 'method-id_bridgerpay_directa24_colombia_payout',
  mexicobank: 'method-id_bridgerpay_directa24_mexico_payout',
  pix: 'method-id_bridgerpay_directa24_pix_payout'
}

const SUPPORTED_REGIONS: FiatProviderSupportedRegions = {
  US: {
    notStateProvinces: ['HI', 'NY']
  }
}

const allowedCurrencyCodes: Record<FiatDirection, { [F in FiatPaymentType]?: FiatProviderAssetMap }> = {
  buy: { credit: { providerId, fiat: {}, crypto: {} } },
  sell: { credit: { providerId, fiat: {}, crypto: {} } }
}
export const paybisProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      io: { makeUuid, store }
    } = params
    const { apiKey, partnerUrl: url, privateKeyB64 } = asApiKeys(apiKeys)

    let partnerUserId = await store.getItem('partnerUserId').catch(e => undefined)
    if (partnerUserId == null || partnerUserId === '') {
      partnerUserId = await makeUuid()
      await store.setItem('partnerUserId', partnerUserId)
    }

    let userIdHasTransactions: boolean | undefined

    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        // Do not allow sell to debit in US, disable all UK
        if (regionCode.countryCode === 'GB' || (direction === 'sell' && paymentTypes.includes('credit') && regionCode.countryCode === 'US')) {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }
        validateRegion(providerId, regionCode, SUPPORTED_REGIONS)
        // Return nothing if paymentTypes are not supported by this provider
        const paymentType = paymentTypes.find(paymentType => allowedPaymentTypes[direction][paymentType] === true)
        if (paymentType == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

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

        try {
          const response = await paybisFetch({ method: 'GET', url, path: `v2/public/user/${partnerUserId}/status`, apiKey })
          const { hasTransactions } = asUserStatus(response)
          userIdHasTransactions = hasTransactions
        } catch (e) {
          console.log(`Paybis: Error getting user status: ${e}`)
        }

        const out = allowedCurrencyCodes[direction][paymentType]
        if (out == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        return out
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const {
          amountType,
          exchangeAmount,
          regionCode,
          paymentTypes,
          pluginId: currencyPluginId,
          promoCode: maybePromoCode,
          pluginUtils,
          fiatCurrencyCode,
          displayCurrencyCode,
          direction,
          tokenId
        } = params
        validateRegion(providerId, regionCode, SUPPORTED_REGIONS)
        const paymentType = paymentTypes.find(paymentType => allowedPaymentTypes[direction][paymentType] === true)
        if (paymentType == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const pairs = paybisPairs[direction]?.data
        if (pairs == null) {
          throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        }

        // Check if the region, payment type, and fiat/crypto codes are supported
        const fiat = removeIsoPrefix(fiatCurrencyCode)

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

        let promoCode: string | undefined
        if (maybePromoCode != null) {
          let amountUsd: string
          const convertFromCc = amountType === 'fiat' ? fiatCurrencyCode : displayCurrencyCode
          if (convertFromCc === 'iso:USD') {
            amountUsd = exchangeAmount
          } else {
            const isoNow = new Date().toISOString()
            const ratePair = `${convertFromCc}_iso:USD`
            const rate = await pluginUtils.getHistoricalRate(ratePair, isoNow)
            amountUsd = mul(exchangeAmount, String(rate))
          }
          // Only use the promo code if the user is requesting $1000 USD or less
          if (lte(amountUsd, '1000')) {
            // Only use the promoCode if this is the user's first purchase
            if (userIdHasTransactions === false) {
              promoCode = maybePromoCode
            }
          }
        }

        const response = await paybisFetch({ method: 'POST', url, path: 'v2/public/quote', apiKey, bodyParams, promoCode })
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
          partnerIcon,
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
            const success = await showUi.requestPermission(['camera'], pluginDisplayName, true)
            if (!success) {
              await showUi.showToast(lstrings.fiat_plugin_cannot_continue_camera_permission)
            }
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId: null })

            let bodyParams
            if (direction === 'buy') {
              bodyParams = {
                cryptoWalletAddress: {
                  currencyCode: paybisCc,
                  address: receiveAddress.segwitAddress ?? receiveAddress.publicAddress
                },
                partnerUserId,
                locale: locale.localeIdentifier.slice(0, 2),
                passwordless: true,
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
                passwordless: true,
                trustedKyc: false,
                quoteId,
                flow: 'sellCrypto',
                depositCallbackUrl: RETURN_URL_PAYMENT,
                paymentMethod: paymentMethodId
              }
            }

            const privateKey = atob(privateKeyB64)
            const promise = paybisFetch({ method: 'POST', url, path: 'v2/public/request', apiKey, bodyParams, promoCode, privateKey, showUi })
            const response = await showUi.showToastSpinner(lstrings.fiat_plugin_finalizing_quote, promise)
            const { oneTimeToken, requestId } = asPublicRequestResponse(response)

            const widgetUrl = isWalletTestnet(coreWallet) ? WIDGET_URL_SANDBOX : WIDGET_URL

            const ott = oneTimeToken != null ? `&oneTimeToken=${oneTimeToken}` : ''
            const promoCodeParam = promoCode != null ? `&promoCode=${promoCode}` : ''

            if (direction === 'buy') {
              const successReturnURL = encodeURIComponent('https://return.edge.app/fiatprovider/buy/paybis?transactionStatus=success')
              const failureReturnURL = encodeURIComponent('https://return.edge.app/fiatprovider/buy/paybis?transactionStatus=fail')
              await showUi.openExternalWebView({
                url: `${widgetUrl}?requestId=${requestId}${ott}${promoCodeParam}&successReturnURL=${successReturnURL}&failureReturnURL=${failureReturnURL}`,
                providerId,
                deeplinkHandler: async link => {
                  const { query, uri } = link
                  console.log('Paybis WebView launch buy success: ' + uri)
                  const { transactionStatus } = query
                  if (transactionStatus === 'success') {
                    await showUi.trackConversion('Buy_Success', {
                      conversionValues: {
                        conversionType: 'buy',
                        sourceFiatCurrencyCode: fiatCurrencyCode,
                        sourceFiatAmount: fiatAmount,
                        destAmount: new CryptoAmount({
                          currencyConfig: coreWallet.currencyConfig,
                          currencyCode: displayCurrencyCode,
                          exchangeAmount: cryptoAmount
                        }),
                        fiatProviderId: providerId,
                        orderId: requestId
                      }
                    })
                    const message =
                      sprintf(lstrings.fiat_plugin_buy_complete_message_s, cryptoAmount, displayCurrencyCode, fiatAmount, fiat, '1') +
                      '\n\n' +
                      sprintf(lstrings.fiat_plugin_buy_complete_message_2_hour_s, '1') +
                      '\n\n' +
                      lstrings.fiat_plugin_sell_complete_message_3
                    await showUi.buttonModal({
                      buttons: {
                        ok: { label: lstrings.string_ok, type: 'primary' }
                      },
                      title: lstrings.fiat_plugin_buy_complete_title,
                      message
                    })
                  } else if (transactionStatus === 'failure') {
                    await showUi.showToast(lstrings.fiat_plugin_buy_failed_try_again, NOT_SUCCESS_TOAST_HIDE_MS)
                  } else {
                    await showUi.showError(new Error(`Paybis: Invalid transactionStatus "${transactionStatus}".`))
                  }
                }
              })
              return
            }

            const successReturnURL = encodeURIComponent(RETURN_URL_SUCCESS)
            const failureReturnURL = encodeURIComponent(RETURN_URL_FAIL)
            const webviewUrl = `${widgetUrl}?requestId=${requestId}&successReturnURL=${successReturnURL}&failureReturnURL=${failureReturnURL}${ott}${promoCodeParam}`
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
                      const payDetails = await paybisFetch({ method: 'GET', url, path: `v2/request/${requestId}/payment-details`, apiKey, promoCode })
                      const { assetId, amount, currencyCode: pbCurrencyCode, network, depositAddress, destinationTag } = asPaymentDetails(payDetails)
                      const { pluginId, tokenId } = PAYBIS_TO_EDGE_CURRENCY_MAP[assetId]

                      console.log(`Creating Paybis payment`)
                      console.log(`  amount: ${amount}`)
                      console.log(`  assetId: ${assetId}`)
                      console.log(`  pbCurrencyCode: ${pbCurrencyCode}`)
                      console.log(`  network: ${network}`)
                      console.log(`  pluginId: ${pluginId}`)
                      console.log(`  tokenId: ${tokenId}`)
                      const nativeAmount = await coreWallet.denominationToNative(amount, displayCurrencyCode)

                      const assetAction: EdgeAssetAction = {
                        assetActionType: 'sell'
                      }
                      const savedAction: EdgeTxActionFiat = {
                        actionType: 'fiat',
                        orderId: requestId,
                        orderUri: `${widgetUrl}?requestId=${requestId}`,
                        isEstimate: true,
                        fiatPlugin: {
                          providerId,
                          providerDisplayName,
                          supportEmail
                        },
                        payinAddress: depositAddress,
                        cryptoAsset: {
                          pluginId: coreWallet.currencyInfo.pluginId,
                          tokenId,
                          nativeAmount
                        },
                        fiatAsset: {
                          fiatCurrencyCode,
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
                      const tx = await showUi.send(sendParams)
                      await showUi.trackConversion('Sell_Success', {
                        conversionValues: {
                          conversionType: 'sell',
                          destFiatCurrencyCode: fiatCurrencyCode,
                          destFiatAmount: fiatAmount,
                          sourceAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            currencyCode: displayCurrencyCode,
                            exchangeAmount: amount
                          }),
                          fiatProviderId: providerId,
                          orderId: requestId
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

                      // Route back to the original URL to show Paybis confirmation screen
                      await showUi.exitScene()
                      await openWebView()
                    } catch (e: unknown) {
                      await showUi.exitScene()
                      // Reopen the webivew on the Paybis payment screen
                      await openWebView()
                      if (e instanceof Error && e.message === SendErrorNoTransaction) {
                        await showUi.showToast(lstrings.fiat_plugin_sell_failed_to_send_try_again, NOT_SUCCESS_TOAST_HIDE_MS)
                      } else if (e instanceof Error && e.message === SendErrorBackPressed) {
                        // Do nothing
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
  showUi?: FiatPluginUi
  bodyParams?: object
  queryParams?: JsonObject
  privateKey?: string
  promoCode?: string
}): Promise<JsonObject> => {
  const { method, url, path, apiKey, bodyParams, queryParams = {}, promoCode, privateKey, showUi } = params
  const urlObj = new URL(url + '/' + path, true)
  const body = bodyParams != null ? JSON.stringify(bodyParams) : undefined

  let signature: string | undefined
  if (privateKey != null) {
    if (body == null) throw new Error('Paybis: Cannot sign without body')
    // Because we will be doing a slow CPU operation in sha512HashAndSign, we need to first
    // call waitForAnimationFrame to ensure the UI spinner is rendered.
    if (showUi != null) await showUi.waitForAnimationFrame()
    signature = sha512HashAndSign(body, privateKey)
  }
  queryParams.apikey = apiKey

  if (promoCode != null) {
    queryParams.promoCode = promoCode
  }
  urlObj.set('query', queryParams)

  const options: EdgeFetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  if (signature != null) {
    options.headers = {
      ...options.headers,
      'x-request-signature': signature
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
      paybisFetch({ method: 'GET', url, path: `v2/public/currency/pairs/buy-crypto`, apiKey })
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
    // XXX Hack. Paybis doesn't have a specific payment method for applepay or googlepay
    // so if we see a creditcard method, we just dupe it for googlepay and applepay.
    const ccMethod = paybisPairs.buy.data.find(pair => pair.name === 'method-id-credit-card')
    if (ccMethod != null) {
      paybisPairs.buy.data.push({
        name: 'fake-id-googlepay',
        pairs: ccMethod.pairs
      })
      paybisPairs.buy.data.push({
        name: 'fake-id-applepay',
        pairs: ccMethod.pairs
      })
    }

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
          paymentMethodObj = { providerId, crypto: {}, fiat: {} }
          allowedCurrencyCodes.buy[edgePaymentType] = paymentMethodObj
        }
        paymentMethodObj.fiat[`iso:${from}`] = true

        // Add the cryptos
        for (const code of to) {
          const edgeTokenId = PAYBIS_TO_EDGE_CURRENCY_MAP[code.currencyCode]
          if (edgeTokenId != null) {
            const { pluginId: currencyPluginId } = edgeTokenId
            let tokens = paymentMethodObj.crypto[currencyPluginId]
            if (tokens == null) {
              tokens = []
              paymentMethodObj.crypto[currencyPluginId] = tokens
            }
            addTokenToArray({ tokenId: edgeTokenId.tokenId }, tokens)
          }
        }
      }
    }
  }
}

const initializeSellPairs = async ({ url, apiKey }: InitializePairs): Promise<void> => {
  if (paybisPairs.sell == null) {
    const promises = [
      paybisFetch({ method: 'GET', url, path: `v2/public/currency/pairs/sell-crypto`, apiKey })
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
          paymentMethodObj = { providerId, crypto: {}, fiat: {} }
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
        let tokens = paymentMethodObj.crypto[currencyPluginId]
        if (tokens == null) {
          tokens = []
          paymentMethodObj.crypto[currencyPluginId] = tokens
        }
        addTokenToArray({ tokenId: edgeTokenId.tokenId }, tokens)

        for (const fiat of to) {
          paymentMethodObj.fiat[`iso:${fiat}`] = true
        }
      }
    }
  }
}
