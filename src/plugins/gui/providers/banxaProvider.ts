// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { gt, lt } from 'biggystring'
import { asArray, asEither, asMaybe, asNumber, asObject, asString, asValue } from 'cleaners'
import { EdgeTokenId } from 'edge-core-js'
import URL from 'url-parse'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { lstrings } from '../../../locales/strings'
import { StringMap } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { fetchInfo } from '../../../util/network'
import { consify, removeIsoPrefix } from '../../../util/utils'
import { SendErrorBackPressed, SendErrorNoTransaction } from '../fiatPlugin'
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
  FiatProviderGetTokenId,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { addTokenToArray } from '../util/providerUtils'
import {
  addExactRegion,
  isDailyCheckDue,
  NOT_SUCCESS_TOAST_HIDE_MS,
  RETURN_URL_CANCEL,
  RETURN_URL_FAIL,
  RETURN_URL_SUCCESS,
  validateExactRegion
} from './common'
const providerId = 'banxa'
const storeId = 'banxa'
const partnerIcon = 'banxa.png'
const pluginDisplayName = 'Banxa'

const TESTNET_ADDRESS = 'bc1qv752cnr3rcht3yyfq2nn6nv7zwczqjmcm80y6w'
let testnet = false

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedCountryCodes: FiatProviderExactRegions = {}
const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    applepay: true,
    credit: true,
    googlepay: true,
    ideal: true,
    interac: true,
    iobank: true,
    payid: true,
    sepa: false, // Leave this to Bity for now
    turkishbank: true
  },
  sell: {
    directtobank: true,
    interac: true,
    iobank: true,
    payid: true,
    sepa: false, // Leave this to Bity for now
    turkishbank: true
  }
}

const asBanxaApiKeys = asObject({
  apiKey: asString,
  hmacUser: asString,
  partnerUrl: asString
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
  'IDEAL',
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
  id: asString,
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

const asBanxaError = asObject({
  errors: asObject({
    // code: asNumber,
    // status: asNumber,
    title: asString
  })
})

const asBanxaQuoteResponse = asEither(
  asObject({
    data: asObject({
      order: asBanxaQuote
    })
  }),
  asBanxaError
)

const asBanxaOrderStatus = asValue(
  'pendingPayment',
  'waitingPayment',
  'paymentReceived',
  'inProgress',
  'coinTransferred',
  'cancelled',
  'declined',
  'expired',
  'complete',
  'refunded'
)

const asBanxaOrderResponse = asObject({
  data: asObject({
    order: asObject({
      id: asString, // "b445de966b55fa23c79aaeeb0f75577d",
      // account_id: asString, // "9fa7a88710e2265c532e87aade064a9e",
      // account_reference: asString, // "0f060f09-0009-4800-800a-05030b0f0207",
      // order_type: asString, // "CRYPTO-SELL",
      // payment_type: asString, // null,
      // ref: asMaybe(asNumber), // null,
      // fiat_code: asString, // "AUD",
      // fiat_amount: asNumber, // 500,
      // coin_code: asString, // "BTC",
      coin_amount: asNumber, // 0,
      wallet_address: asMaybe(asString), // null,
      wallet_address_tag: asMaybe(asString), // null,
      // fee: asMaybe(asNumber), // null,
      // fee_tax: asMaybe(asNumber), // null,
      // payment_fee: asMaybe(asNumber), // null,
      // payment_fee_tax: asMaybe(asNumber), // null,
      // commission: asMaybe(asNumber), // null,
      // tx_hash: asString, // null,
      // tx_confirms: asMaybe(asNumber), // null,
      // created_date: asString, // "20-Sep-2023",
      // created_at: asString, // "20-Sep-2023 23:01:19",
      status: asBanxaOrderStatus // "pendingPayment",
      // completed_at: asString, // null,
      // merchant_fee: asMaybe(asNumber), // null,
      // merchant_commission: asMaybe(asNumber), // null,
      // meta_data: asString, // null,
      // blockchain: asObject({
      //   id: asNumber, // 1,
      //   code: asString, // "BTC",
      //   description: asString // "Bitcoin"
      // })
      // network_fee: asMaybe(asNumber) // null
    })
  })
})

const asBanxaPaymentMethods = asObject({
  data: asObject({
    payment_methods: asArray(asBanxaPaymentMethod)
  })
})

const asBanxaCountry = asObject({
  country_code: asString
  // country_name: asString
})

const asBanxaCountries = asObject({
  data: asObject({
    countries: asArray(asBanxaCountry)
  })
})

const asBanxaState = asObject({
  state_code: asString
  // state_name: asString
})

const asBanxaStates = asObject({
  data: asObject({
    states: asArray(asBanxaState)
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
  SOL: 'solana',
  XLM: 'stellar',
  XRP: 'ripple',
  XTZ: 'tezos'
}

const COIN_TO_CURRENCY_CODE_MAP: StringMap = { BTC: 'BTC' }

const asInfoCreateHmacResponse = asObject({ signature: asString })

const allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = {
  buy: { providerId, fiat: {}, crypto: {} },
  sell: { providerId, fiat: {}, crypto: {} }
}
const banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap> = { buy: {}, sell: {} }
let lastChecked = 0

export const banxaProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const {
      apiKeys,
      getTokenId,
      io: { makeUuid, store }
    } = params
    const { apiKey, hmacUser, partnerUrl: url } = asBanxaApiKeys(apiKeys)
    if (url.includes('sandbox')) {
      testnet = true
      CURRENCY_PLUGINID_MAP.BTC = 'bitcointestnet'
      COIN_TO_CURRENCY_CODE_MAP.BTC = 'TESTBTC'
    }

    let banxaUsername = await store.getItem('username').catch(e => undefined)
    if (banxaUsername == null || banxaUsername === '') {
      banxaUsername = await makeUuid()
      await store.setItem('username', banxaUsername)
    }

    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const paymentsMap = banxaPaymentsMap[direction]

        // XXX Hack. Banxa doesn't return any payment methods for sell unless the source asset is
        // specified. BTC is most supported so we add that for the query of sell payment methods
        let paymentMethodsPath
        if (direction === 'buy') {
          paymentMethodsPath = 'api/payment-methods'
        } else {
          paymentMethodsPath = 'api/payment-methods?source=BTC'
        }

        if (isDailyCheckDue(lastChecked)) {
          const promises = [
            banxaFetch({ method: 'GET', url, hmacUser, path: 'api/countries', apiKey }).then(response => {
              const countries = asBanxaCountries(response)
              for (const { country_code: countryCode } of countries.data.countries) {
                if (countryCode !== 'US') {
                  addExactRegion(allowedCountryCodes, countryCode)
                }
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: 'api/countries/us/states', apiKey }).then(response => {
              const states = asBanxaStates(response)
              for (const { state_code: stateCode } of states.data.states) {
                addExactRegion(allowedCountryCodes, 'US', stateCode)
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: `api/coins/sell`, apiKey }).then(response => {
              const cryptoCurrencies = asBanxaCryptoCoins(response)
              for (const coin of cryptoCurrencies.data.coins) {
                for (const chain of coin.blockchains) {
                  // @ts-expect-error
                  const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
                  if (currencyPluginId != null) {
                    const edgeCurrencyCode = COIN_TO_CURRENCY_CODE_MAP[coin.coin_code] ?? coin.coin_code
                    addToAllowedCurrencies(getTokenId, currencyPluginId, 'sell', edgeCurrencyCode, coin)
                  }
                }
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: `api/fiats/sell`, apiKey }).then(response => {
              const fiatCurrencies = asBanxaFiats(response)
              for (const fiat of fiatCurrencies.data.fiats) {
                allowedCurrencyCodes.sell.fiat['iso:' + fiat.fiat_code] = true
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: `api/coins/buy`, apiKey }).then(response => {
              const cryptoCurrencies = asBanxaCryptoCoins(response)
              for (const coin of cryptoCurrencies.data.coins) {
                for (const chain of coin.blockchains) {
                  // @ts-expect-error
                  const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
                  if (currencyPluginId != null) {
                    const edgeCurrencyCode = COIN_TO_CURRENCY_CODE_MAP[coin.coin_code] ?? coin.coin_code
                    addToAllowedCurrencies(getTokenId, currencyPluginId, 'buy', edgeCurrencyCode, coin)
                  }
                }
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: `api/fiats/buy`, apiKey }).then(response => {
              const fiatCurrencies = asBanxaFiats(response)
              for (const fiat of fiatCurrencies.data.fiats) {
                allowedCurrencyCodes.buy.fiat['iso:' + fiat.fiat_code] = true
              }
            }),

            banxaFetch({ method: 'GET', url, hmacUser, path: paymentMethodsPath, apiKey }).then(response => {
              const banxaPayments = asBanxaPaymentMethods(response)
              buildPaymentsMap(banxaPayments, paymentsMap)
            })
          ]
          await Promise.all(promises)
          lastChecked = Date.now()
        }

        validateExactRegion(providerId, regionCode, allowedCountryCodes)
        return allowedCurrencyCodes[direction]
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { pluginId, regionCode, exchangeAmount, amountType, paymentTypes, fiatCurrencyCode, displayCurrencyCode, direction, tokenId } = params
        validateExactRegion(providerId, regionCode, allowedCountryCodes)

        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        // Check if the region, payment type, and fiat/crypto codes are supported
        const fiatCode = removeIsoPrefix(fiatCurrencyCode)

        let banxaCrypto
        try {
          banxaCrypto = edgeToBanxaCrypto(pluginId, direction, tokenId)
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
            paymentObj = getPaymentIdLimit(direction, fiatCode, banxaCoin, pt)
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
            const pmResponse = await banxaFetch({ method: 'GET', url, hmacUser, path: `api/payment-methods?source=${banxaCoin}`, apiKey })
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
          queryParams.source = fiatCode
          queryParams.target = banxaCoin
          if (amountType === 'fiat') {
            queryParams.source_amount = exchangeAmount
            checkMinMax(exchangeAmount, paymentObj, fiatCode)
          } else {
            queryParams.target_amount = exchangeAmount
          }
        } else {
          queryParams.source = banxaCoin
          queryParams.target = fiatCode
          if (amountType === 'fiat') {
            queryParams.target_amount = exchangeAmount
            checkMinMax(exchangeAmount, paymentObj, fiatCode)
          } else {
            queryParams.source_amount = exchangeAmount
          }
        }

        const response = await banxaFetch({ method: 'GET', url, hmacUser, path: 'api/prices', apiKey, queryParams })
        const banxaPrices = asBanxaPricesResponse(response)
        const priceQuote = banxaPrices.data.prices[0]
        console.log('Got Banxa Quote:')
        consify(priceQuote)

        checkMinMax(priceQuote.fiat_amount, paymentObj, fiatCode)
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
            const success = await showUi.requestPermission(['camera'], pluginDisplayName, true)
            if (!success) {
              await showUi.showError(lstrings.fiat_plugin_cannot_continue_camera_permission)
            }
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId: null })

            const bodyParams: any = {
              payment_method_id: paymentObj?.id ?? '',
              account_reference: banxaUsername,
              source: queryParams.source,
              target: queryParams.target,
              blockchain: banxaChain,
              return_url_on_success: RETURN_URL_SUCCESS,
              return_url_on_cancelled: RETURN_URL_CANCEL,
              return_url_on_failure: RETURN_URL_FAIL
            }
            if (direction === 'buy') {
              if (testnet && banxaChain === 'BTC') {
                bodyParams.wallet_address = TESTNET_ADDRESS
              } else {
                bodyParams.wallet_address = receiveAddress.publicAddress
              }
            } else {
              if (testnet && banxaChain === 'BTC') {
                bodyParams.refund_address = TESTNET_ADDRESS
              } else {
                bodyParams.refund_address = receiveAddress.publicAddress
              }
            }

            if (queryParams.source_amount != null) {
              bodyParams.source_amount = queryParams.source_amount
            } else {
              bodyParams.target_amount = queryParams.target_amount
            }
            const response = await banxaFetch({ method: 'POST', url, hmacUser, path: 'api/orders', apiKey, bodyParams })
            const banxaQuote = asBanxaQuoteResponse(response)

            if ('errors' in banxaQuote) {
              throw new Error(banxaQuote.errors.title)
            }

            let interval: ReturnType<typeof setInterval> | undefined
            let insideInterval = false

            if (direction === 'buy') {
              await showUi.openExternalWebView({ url: banxaQuote.data.order.checkout_url })
            } else {
              const { checkout_url: checkoutUrl, id } = banxaQuote.data.order
              const banxaUrl = new URL(checkoutUrl)
              const { origin: banxaOrigin } = banxaUrl
              await showUi.openWebView({
                url: checkoutUrl,
                onClose: () => {
                  clearInterval(interval)
                },
                onUrlChange: async (changeUrl: string) => {
                  console.log(`onUrlChange url=${changeUrl}`)
                  if (changeUrl === RETURN_URL_SUCCESS) {
                    clearInterval(interval)

                    await showUi.exitScene()
                  } else if (changeUrl === RETURN_URL_CANCEL) {
                    clearInterval(interval)
                    await showUi.showToast(lstrings.fiat_plugin_sell_cancelled, NOT_SUCCESS_TOAST_HIDE_MS)
                    await showUi.exitScene()
                  } else if (changeUrl === RETURN_URL_FAIL) {
                    clearInterval(interval)
                    await showUi.showToast(lstrings.fiat_plugin_sell_failed_try_again, NOT_SUCCESS_TOAST_HIDE_MS)
                    await showUi.exitScene()
                  } else if (changeUrl.startsWith(`${banxaOrigin}/status/`)) {
                    if (interval == null) {
                      interval = setInterval(async () => {
                        try {
                          if (insideInterval) return
                          insideInterval = true
                          const orderResponse = await banxaFetch({ method: 'GET', url, hmacUser, path: `api/orders/${id}`, apiKey })
                          const order = asBanxaOrderResponse(orderResponse)
                          const { coin_amount: coinAmount, status, wallet_address: publicAddress } = order.data.order
                          const nativeAmount = await coreWallet.denominationToNative(coinAmount.toString(), displayCurrencyCode)
                          if (status === 'waitingPayment') {
                            // Launch the SendScene to make payment
                            const sendParams: SendScene2Params = {
                              walletId: coreWallet.id,
                              tokenId,
                              spendInfo: {
                                tokenId,
                                spendTargets: [
                                  {
                                    nativeAmount,
                                    publicAddress
                                  }
                                ]
                              },
                              lockTilesMap: {
                                address: true,
                                amount: true,
                                wallet: true
                              },
                              hiddenFeaturesMap: {
                                address: true
                              }
                            }
                            const edgeTx = await showUi.send(sendParams)

                            // At this point we'll call it success
                            clearInterval(interval)
                            interval = undefined

                            await showUi.trackConversion('Sell_Success', {
                              conversionValues: {
                                conversionType: 'sell',
                                destFiatCurrencyCode: fiatCurrencyCode,
                                destFiatAmount: priceQuote.fiat_amount,
                                sourceAmount: new CryptoAmount({
                                  currencyConfig: coreWallet.currencyConfig,
                                  currencyCode: displayCurrencyCode,
                                  exchangeAmount: coinAmount
                                }),
                                fiatProviderId: providerId,
                                orderId: id
                              }
                            })

                            // Below is an optional step
                            const { txid } = edgeTx
                            // Post the txid back to Banxa
                            const bodyParams = {
                              tx_hash: txid,
                              source_address: receiveAddress.publicAddress,
                              destination_address: publicAddress
                            }
                            await banxaFetch({ method: 'POST', url, hmacUser, path: `api/orders/${id}/confirm`, apiKey, bodyParams }).catch(e =>
                              console.error(String(e))
                            )
                          }
                          insideInterval = false
                        } catch (e: any) {
                          if (e.message === SendErrorBackPressed) {
                            await showUi.exitScene()
                          } else if (e.message === SendErrorNoTransaction) {
                            await showUi.exitScene()
                            await showUi.showToast(lstrings.fiat_plugin_sell_failed_to_send_try_again)
                          } else {
                            await showUi.showError(e)
                          }
                          insideInterval = false
                        }
                      }, 3000)
                    }
                  }
                }
              })
            }
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

const generateHmac = async (apiKey: string, hmacUser: string, data: string, nonce: string) => {
  const body = JSON.stringify({ data })
  const response = await fetchInfo(
    `v1/createHmac/${hmacUser}`,
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
  hmacUser: string
  bodyParams?: object
  queryParams?: object
}): Promise<string> => {
  const { hmacUser, method, url, path, apiKey, bodyParams, queryParams } = params
  const urlObj = new URL(url + '/' + path, true)
  const body = bodyParams != null ? JSON.stringify(bodyParams) : undefined

  if (method === 'GET' && typeof queryParams === 'object') {
    urlObj.set('query', queryParams)
  }

  const hmacpath = urlObj.href.replace(urlObj.origin + '/', '')

  const nonce = Date.now().toString()
  let hmacData = method + '\n' + hmacpath + '\n' + nonce
  hmacData += method === 'POST' ? '\n' + (body ?? '') : ''

  const hmac = await generateHmac(apiKey, hmacUser, hmacData, nonce)
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

const addToAllowedCurrencies = (
  getTokenId: FiatProviderGetTokenId,
  pluginId: string,
  direction: FiatDirection,
  currencyCode: string,
  coin: BanxaCryptoCoin
) => {
  if (allowedCurrencyCodes[direction].crypto[pluginId] == null) allowedCurrencyCodes[direction].crypto[pluginId] = []
  const tokens = allowedCurrencyCodes[direction].crypto[pluginId]
  const tokenId = getTokenId(pluginId, currencyCode)
  if (tokenId === undefined) return
  addTokenToArray({ tokenId, otherInfo: coin }, tokens)
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
  IDEAL: 'ideal',
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

// Takes an EdgeAsset and returns the corresponding Banxa chain code and coin code
const edgeToBanxaCrypto = (pluginId: string, direction: FiatDirection, tokenId: EdgeTokenId): { banxaChain: string; banxaCoin: string } => {
  const tokens = allowedCurrencyCodes[direction].crypto[pluginId]
  if (tokens == null) throw new Error(`edgeToBanxaCrypto ${pluginId} not allowed`)
  const providerToken = tokens.find(t => t.tokenId === tokenId)
  const banxaCoin = asBanxaCryptoCoin(providerToken?.otherInfo)
  if (banxaCoin == null) throw new Error(`edgeToBanxaCrypto ${pluginId} ${tokenId} not allowed`)
  for (const chain of banxaCoin.blockchains) {
    // @ts-expect-error
    const edgePluginId = CURRENCY_PLUGINID_MAP[chain.code]
    if (edgePluginId === pluginId) {
      return { banxaChain: chain.code, banxaCoin: banxaCoin.coin_code }
    }
  }
  throw new Error(`edgeToBanxaCrypto No matching pluginId ${pluginId}`)
}
