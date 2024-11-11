// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { asArray, asBoolean, asEither, asNull, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeAssetAction, EdgeSpendInfo, EdgeTokenId, EdgeTxActionFiat } from 'edge-core-js'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { lstrings } from '../../../locales/strings'
import { StringMap } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { removeIsoPrefix } from '../../../util/utils'
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
import { addTokenToArray } from '../util/providerUtils'
import { addExactRegion, isDailyCheckDue, NOT_SUCCESS_TOAST_HIDE_MS, RETURN_URL_PAYMENT, validateExactRegion } from './common'
const providerId = 'moonpay'
const storeId = 'com.moonpay'
const partnerIcon = 'moonpay_symbol_prp.png'
const pluginDisplayName = 'Moonpay'
const supportEmail = 'support@moonpay.com'

const allowedCurrencyCodes: Record<FiatDirection, { [F in FiatPaymentType]?: FiatProviderAssetMap }> = {
  buy: { credit: { providerId, fiat: {}, crypto: {} }, paypal: { providerId, fiat: {}, crypto: {} } },
  sell: {
    credit: { providerId, fiat: {}, crypto: {}, requiredAmountType: 'crypto' },
    paypal: { providerId, fiat: {}, crypto: {}, requiredAmountType: 'crypto' }
  }
}
const allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions> = { buy: {}, sell: {} }

const asMetadata = asObject({
  contractAddress: asEither(asString, asNull), // "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
  // chainId: asString, // "1"
  networkCode: asString // "ethereum"
})

const asMoonpayCurrency = asObject({
  type: asValue('crypto', 'fiat'),
  code: asString,
  name: asString,
  maxAmount: asEither(asNumber, asNull),
  minAmount: asEither(asNumber, asNull),
  maxBuyAmount: asEither(asNumber, asNull),
  minBuyAmount: asEither(asNumber, asNull),
  maxSellAmount: asOptional(asNumber),
  minSellAmount: asOptional(asNumber),
  metadata: asOptional(asMetadata),
  isSellSupported: asOptional(asBoolean),
  isSuspended: asOptional(asBoolean),
  isSupportedInUS: asOptional(asBoolean)
})
export type MoonpayCurrency = ReturnType<typeof asMoonpayCurrency>

const asMoonpayCurrencies = asArray(asMoonpayCurrency)

const asMoonpaySellQuote = asObject({
  baseCurrencyCode: asString,
  baseCurrencyAmount: asNumber,
  quoteCurrencyAmount: asNumber
})

const asMoonpayBuyQuote = asObject({
  baseCurrencyCode: asString,
  baseCurrencyAmount: asNumber,
  quoteCurrencyAmount: asNumber,
  quoteCurrencyCode: asString,
  // quoteCurrencyPrice: asNumber,
  // feeAmount: asNumber,
  // extraFeeAmount: asNumber,
  // extraFeePercentage: asNumber,
  // networkFeeAmount: asNumber,
  totalAmount: asNumber
})

const asMoonpayQuote = asEither(asMoonpayBuyQuote, asMoonpaySellQuote)

const asState = asObject({
  code: asString,
  // "name": "Alabama",
  isBuyAllowed: asBoolean,
  // "isNftAllowed": true,
  isSellAllowed: asBoolean,
  // "isBalanceLedgerWithdrawAllowed": true,
  isAllowed: asBoolean
  // "isFiatBalanceAllowed": false
})

const asMoonpayCountry = asObject({
  alpha2: asString,
  isAllowed: asBoolean,
  isBuyAllowed: asBoolean,
  isSellAllowed: asBoolean,
  states: asOptional(asArray(asState))
})

const asApiKeys = asString

const asMoonpayCountries = asArray(asMoonpayCountry)

type MoonpayPaymentMethod = 'ach_bank_transfer' | 'credit_debit_card' | 'paypal'

interface MoonpayWidgetQueryParams {
  apiKey: string
  lockAmount: true
  showAllCurrencies: false
  paymentMethod: MoonpayPaymentMethod
  redirectURL: string
}

type MoonpayBuyWidgetQueryParams = MoonpayWidgetQueryParams & {
  /** crypto currency code */
  currencyCode: string

  /** fiat currency code */
  baseCurrencyCode: string
  walletAddress: string
  enableRecurringBuys: false

  /** crypto amount to buy */
  quoteCurrencyAmount?: number

  /** fiat amount to spend  */
  baseCurrencyAmount?: number
}

type MoonpaySellWidgetQueryParams = MoonpayWidgetQueryParams & {
  /** fiat currency code */
  quoteCurrencyCode: string

  /** crypto currency code */
  baseCurrencyCode: string
  refundWalletAddress: string

  /** fiat amount to receive */
  quoteCurrencyAmount?: number

  /** crypto amount to sell */
  baseCurrencyAmount?: number
}

const MOONPAY_PAYMENT_TYPE_MAP: Partial<Record<FiatPaymentType, MoonpayPaymentMethod>> = {
  applepay: 'credit_debit_card',
  credit: 'credit_debit_card',
  googlepay: 'credit_debit_card',
  iach: 'ach_bank_transfer',
  paypal: 'paypal'
}

const NETWORK_CODE_PLUGINID_MAP: StringMap = {
  algorand: 'algorand',
  arbitrum: 'arbitrum',
  avalanche_c_chain: 'avalanche',
  base: 'base',
  bitcoin: 'bitcoin',
  bitcoin_cash: 'bitcoincash',
  cardano: 'cardano',
  cosmos: 'cosmoshub',
  dogecoin: 'dogecoin',
  ethereum: 'ethereum',
  litecoin: 'litecoin',
  optimism: 'optimism',
  osmosis: 'osmosis',
  polygon: 'polygon',
  ripple: 'ripple',
  solana: 'solana',
  stellar: 'stellar',
  tron: 'tron',
  ton: 'ton',
  zksync: 'zksync'
}

const PAYMENT_TYPE_MAP: Partial<Record<FiatPaymentType, FiatPaymentType | undefined>> = {
  applepay: 'credit',
  credit: 'credit',
  googlepay: 'credit',
  paypal: 'paypal'
}

let lastChecked = 0

export const moonpayProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys, getTokenIdFromContract } = params
    const apiKey = asApiKeys(apiKeys)
    if (apiKey == null) throw new Error('Moonpay missing apiKey')
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        const paymentType = PAYMENT_TYPE_MAP[paymentTypes[0]] ?? paymentTypes[0]

        // Return nothing if paymentTypes are not supported by this provider
        const assetMap = allowedCurrencyCodes[direction][paymentType]
        if (assetMap == null || regionCode.countryCode === 'GB') throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        if (Object.keys(assetMap.crypto).length === 0 || isDailyCheckDue(lastChecked)) {
          const response = await fetch(`https://api.moonpay.com/v3/currencies?apiKey=${apiKey}`).catch(e => undefined)
          if (response == null || !response.ok) return assetMap

          const result = await response.json()
          let moonpayCurrencies: MoonpayCurrency[] = []
          try {
            moonpayCurrencies = asMoonpayCurrencies(result)

            // HACK: Moonpay API returns the burn address for EVM chain native currency
            moonpayCurrencies = moonpayCurrencies.map(currency => {
              if (currency.metadata?.contractAddress === '0x0000000000000000000000000000000000000000') {
                currency.metadata.contractAddress = null
              }
              return currency
            })
          } catch (error: any) {
            console.log(error.message)
            console.log(JSON.stringify(error, null, 2))
            return assetMap
          }
          for (const currency of moonpayCurrencies) {
            if (direction === 'sell' && currency.isSellSupported !== true) {
              continue
            }

            if (currency.type === 'crypto') {
              if (regionCode.countryCode === 'US' && currency.isSupportedInUS !== true) {
                continue
              }
              if (currency.isSuspended) continue
              const { metadata } = currency
              if (metadata == null) continue
              const { contractAddress, networkCode } = metadata
              const pluginId = NETWORK_CODE_PLUGINID_MAP[networkCode]
              if (pluginId == null) continue

              let tokenId: EdgeTokenId
              if (contractAddress != null) {
                const tId = getTokenIdFromContract({ pluginId, contractAddress })
                if (tId === undefined) continue
                tokenId = tId
              } else {
                tokenId = null
              }
              if (assetMap.crypto[pluginId] == null) assetMap.crypto[pluginId] = []
              addTokenToArray({ tokenId, otherInfo: currency }, assetMap.crypto[pluginId])
            } else {
              assetMap.fiat['iso:' + currency.code.toUpperCase()] = currency
            }
          }

          const response2 = await fetch(`https://api.moonpay.com/v3/countries?apiKey=${apiKey}`).catch(e => undefined)
          if (response2 == null || !response2.ok) throw new Error('Moonpay failed to fetch countries')

          const result2 = await response2.json()
          const countries = asMoonpayCountries(result2)
          for (const country of countries) {
            if (country.isAllowed) {
              if (country.states == null) {
                if (country.isAllowed) {
                  if (country.isBuyAllowed) {
                    allowedCountryCodes.buy[country.alpha2] = true
                  }
                  if (country.isSellAllowed) {
                    allowedCountryCodes.sell[country.alpha2] = true
                  }
                }
              } else {
                const countryCode = country.alpha2
                // Validate state support
                for (const state of country.states) {
                  if (state.isAllowed) {
                    const stateProvinceCode = state.code

                    if (state.isBuyAllowed) {
                      addExactRegion(allowedCountryCodes.buy, countryCode, stateProvinceCode)
                    }
                    if (state.isSellAllowed) {
                      addExactRegion(allowedCountryCodes.sell, countryCode, stateProvinceCode)
                    }
                  }
                }
              }
            }
          }
          lastChecked = Date.now()
        }
        validateExactRegion(providerId, regionCode, allowedCountryCodes[direction])
        return assetMap
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { direction, fiatCurrencyCode, regionCode, paymentTypes, displayCurrencyCode, tokenId } = params
        validateExactRegion(providerId, regionCode, allowedCountryCodes[direction])

        const paymentType = PAYMENT_TYPE_MAP[paymentTypes[0]] ?? paymentTypes[0]
        const assetMap = allowedCurrencyCodes[direction][paymentType]
        if (assetMap == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const paymentMethod = MOONPAY_PAYMENT_TYPE_MAP[paymentType]
        if (paymentMethod == null) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        let amountParam = ''
        const tokens = assetMap.crypto[params.pluginId]
        const moonpayCurrency = tokens.find(token => token.tokenId === params.tokenId)
        const cryptoCurrencyObj = asMoonpayCurrency(moonpayCurrency?.otherInfo)
        const fiatCurrencyObj = asMoonpayCurrency(assetMap.fiat[params.fiatCurrencyCode])
        if (cryptoCurrencyObj == null || fiatCurrencyObj == null) throw new Error('Moonpay could not query supported currencies')

        let maxFiat: number
        let minFiat: number
        let maxCrypto: number
        let minCrypto: number

        if (direction === 'buy') {
          maxFiat = fiatCurrencyObj.maxBuyAmount ?? fiatCurrencyObj.maxAmount ?? 0
          minFiat = fiatCurrencyObj.minBuyAmount ?? fiatCurrencyObj.minAmount ?? Infinity
          maxCrypto = cryptoCurrencyObj.maxBuyAmount ?? cryptoCurrencyObj.maxAmount ?? 0
          minCrypto = cryptoCurrencyObj.minBuyAmount ?? cryptoCurrencyObj.minAmount ?? Infinity
        } else {
          maxFiat = fiatCurrencyObj.maxSellAmount ?? fiatCurrencyObj.maxAmount ?? 0
          minFiat = fiatCurrencyObj.minSellAmount ?? fiatCurrencyObj.minAmount ?? Infinity
          maxCrypto = cryptoCurrencyObj.maxSellAmount ?? cryptoCurrencyObj.maxAmount ?? 0
          minCrypto = cryptoCurrencyObj.minSellAmount ?? cryptoCurrencyObj.minAmount ?? Infinity
        }

        const exchangeAmount = parseFloat(params.exchangeAmount)
        const displayFiatCurrencyCode = removeIsoPrefix(params.fiatCurrencyCode)
        if (params.amountType === 'fiat') {
          if (exchangeAmount > maxFiat)
            throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: maxFiat, displayCurrencyCode: displayFiatCurrencyCode })
          if (exchangeAmount < minFiat)
            throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: minFiat, displayCurrencyCode: displayFiatCurrencyCode })
          // User typed a fiat amount. Need a crypto value
          if (direction === 'buy') {
            amountParam = `baseCurrencyAmount=${params.exchangeAmount}`
          } else {
            // Moonpay API doesn't let us specify a fiat amount for sell
            throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
          }
        } else {
          if (exchangeAmount > maxCrypto) throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: maxCrypto, displayCurrencyCode })
          if (exchangeAmount < minCrypto) throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: minCrypto, displayCurrencyCode })
          if (direction === 'buy') {
            amountParam = `quoteCurrencyAmount=${params.exchangeAmount}`
          } else {
            amountParam = `baseCurrencyAmount=${params.exchangeAmount}`
          }
        }

        const fiatCode = removeIsoPrefix(params.fiatCurrencyCode).toLowerCase()
        let url
        if (direction === 'buy') {
          url = `https://api.moonpay.com/v3/currencies/${cryptoCurrencyObj.code}/buy_quote/?apiKey=${apiKey}&quoteCurrencyCode=${cryptoCurrencyObj.code}&baseCurrencyCode=${fiatCode}&paymentMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}`
        } else {
          url = `https://api.moonpay.com/v3/currencies/${cryptoCurrencyObj.code}/sell_quote/?apiKey=${apiKey}&quoteCurrencyCode=${fiatCode}&payoutMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}`
        }

        const response = await fetch(url).catch(e => {
          console.log(e)
          return undefined
        })

        if (response == null || !response.ok) {
          throw new Error('Moonpay failed to fetch quote')
        }

        const result = await response.json()
        const moonpayQuote = asMoonpayQuote(result)

        console.log('Got Moonpay quote')
        console.log(JSON.stringify(moonpayQuote, null, 2))

        const fiatAmount = 'totalAmount' in moonpayQuote ? moonpayQuote.totalAmount.toString() : moonpayQuote.quoteCurrencyAmount.toString()
        const cryptoAmount = direction === 'buy' ? moonpayQuote.quoteCurrencyAmount.toString() : moonpayQuote.baseCurrencyAmount.toString()

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
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { coreWallet, showUi } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId: null })
            if (direction === 'buy') {
              const urlObj = new URL('https://buy.moonpay.com?', true)
              const queryObj: MoonpayBuyWidgetQueryParams = {
                apiKey,
                walletAddress: receiveAddress.publicAddress,
                currencyCode: cryptoCurrencyObj.code,
                paymentMethod,
                baseCurrencyCode: fiatCurrencyObj.code,
                lockAmount: true,
                showAllCurrencies: false,
                enableRecurringBuys: false,
                redirectURL: `https://deep.edge.app/fiatprovider/buy/moonpay`
              }
              if (params.amountType === 'crypto') {
                queryObj.quoteCurrencyAmount = moonpayQuote.quoteCurrencyAmount
              } else {
                queryObj.baseCurrencyAmount = 'totalAmount' in moonpayQuote ? moonpayQuote.totalAmount : undefined
              }
              urlObj.set('query', queryObj)
              console.log('Approving moonpay buy quote url=' + urlObj.href)
              await showUi.openExternalWebView({
                url: urlObj.href,
                providerId,
                deeplinkHandler: async link => {
                  const { query, uri } = link
                  console.log('Moonpay WebView launch buy success: ' + uri)
                  const { transactionId, transactionStatus } = query
                  if (transactionId == null || transactionStatus == null) {
                    return
                  }
                  if (transactionStatus !== 'pending') {
                    return
                  }
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
                      orderId: transactionId
                    }
                  })

                  const message =
                    sprintf(lstrings.fiat_plugin_buy_complete_message_s, cryptoAmount, displayCurrencyCode, fiatAmount, displayFiatCurrencyCode, '1') +
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
                }
              })
            } else {
              const urlObj = new URL('https://sell.moonpay.com?', true)
              const queryObj: MoonpaySellWidgetQueryParams = {
                apiKey,
                refundWalletAddress: receiveAddress.publicAddress,
                quoteCurrencyCode: fiatCurrencyObj.code,
                paymentMethod,
                baseCurrencyCode: cryptoCurrencyObj.code,
                lockAmount: true,
                showAllCurrencies: false,
                redirectURL: RETURN_URL_PAYMENT
              }
              if (params.amountType === 'crypto') {
                queryObj.baseCurrencyAmount = moonpayQuote.baseCurrencyAmount
              } else {
                queryObj.quoteCurrencyAmount = 'totalAmount' in moonpayQuote ? moonpayQuote.totalAmount : undefined
              }
              urlObj.set('query', queryObj)
              console.log('Approving moonpay sell quote url=' + urlObj.href)

              let inPayment = false

              const openWebView = async () => {
                await showUi.openWebView({
                  url: urlObj.href,
                  onUrlChange: async (uri: string) => {
                    console.log('Moonpay WebView url change: ' + uri)

                    if (uri.startsWith(RETURN_URL_PAYMENT)) {
                      console.log('Moonpay WebView launch payment: ' + uri)
                      const urlObj = new URL(uri, true)
                      const { query } = urlObj
                      const { baseCurrencyAmount, baseCurrencyCode, depositWalletAddress, depositWalletAddressTag, transactionId } = query
                      if (inPayment) return
                      inPayment = true
                      try {
                        if (baseCurrencyAmount == null || baseCurrencyCode == null || depositWalletAddress == null || transactionId == null) {
                          throw new Error('Moonpay missing parameters')
                        }

                        const nativeAmount = await coreWallet.denominationToNative(baseCurrencyAmount, displayCurrencyCode)

                        const assetAction: EdgeAssetAction = {
                          assetActionType: 'sell'
                        }
                        const savedAction: EdgeTxActionFiat = {
                          actionType: 'fiat',
                          orderId: transactionId,
                          orderUri: `https://sell.moonpay.com/transaction_receipt?transactionId=${transactionId}`,
                          isEstimate: true,
                          fiatPlugin: {
                            providerId,
                            providerDisplayName: pluginDisplayName,
                            supportEmail
                          },
                          payinAddress: depositWalletAddress,
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
                              publicAddress: depositWalletAddress
                            }
                          ]
                        }

                        if (depositWalletAddressTag != null) {
                          spendInfo.memos = [
                            {
                              type: 'text',
                              value: depositWalletAddressTag,
                              hidden: true
                            }
                          ]
                        }

                        const sendParams: SendScene2Params = {
                          walletId: coreWallet.id,
                          tokenId,
                          spendInfo,
                          dismissAlert: true,
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
                              exchangeAmount: baseCurrencyAmount
                            }),
                            fiatProviderId: providerId,
                            orderId: transactionId
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

                        const message =
                          sprintf(lstrings.fiat_plugin_sell_complete_message_s, cryptoAmount, displayCurrencyCode, fiatAmount, displayFiatCurrencyCode, '1') +
                          '\n\n' +
                          sprintf(lstrings.fiat_plugin_sell_complete_message_2_hour_s, '1') +
                          '\n\n' +
                          lstrings.fiat_plugin_sell_complete_message_3
                        await showUi.buttonModal({
                          buttons: {
                            ok: { label: lstrings.string_ok, type: 'primary' }
                          },
                          title: lstrings.fiat_plugin_sell_complete_title,
                          message
                        })
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
