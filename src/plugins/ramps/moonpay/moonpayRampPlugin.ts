import { mul } from 'biggystring'
import { asMaybe, asString } from 'cleaners'
import type {
  EdgeAssetAction,
  EdgeMemo,
  EdgeSpendInfo,
  EdgeTokenId,
  EdgeTxActionFiat
} from 'edge-core-js'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast
} from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import type { StringMap } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import {
  findTokenIdByNetworkLocation,
  getCurrencyCodeMultiplier
} from '../../../util/CurrencyInfoHelpers'
import { removeIsoPrefix } from '../../../util/utils'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import type {
  FiatDirection,
  FiatPaymentType,
  FiatPluginRegionCode,
  SaveTxActionParams
} from '../../gui/fiatPluginTypes'
import {
  FiatProviderError,
  type FiatProviderExactRegions,
  type ProviderToken
} from '../../gui/fiatProviderTypes'
import {
  addExactRegion,
  NOT_SUCCESS_TOAST_HIDE_MS,
  RETURN_URL_PAYMENT,
  validateExactRegion
} from '../../gui/providers/common'
import { addTokenToArray } from '../../gui/util/providerUtils'
import { rampDeeplinkManager } from '../rampDeeplinkHandler'
import type {
  RampApproveQuoteParams,
  RampCheckSupportRequest,
  RampInfo,
  RampPlugin,
  RampPluginConfig,
  RampPluginFactory,
  RampQuote,
  RampQuoteRequest,
  RampSupportResult
} from '../rampPluginTypes'
import {
  validateRampCheckSupportRequest,
  validateRampQuoteRequest
} from '../utils/constraintUtils'
import { getSettlementRange } from '../utils/getSettlementRange'
import { openExternalWebView } from '../utils/webViewUtils'
import {
  asInitOptions,
  asMoonpayCountries,
  asMoonpayCurrencies,
  asMoonpayCurrency,
  asMoonpayQuote,
  type MoonpayBuyWidgetQueryParams,
  type MoonpayCurrency,
  type MoonpayPaymentMethod,
  type MoonpaySellWidgetQueryParams
} from './moonpayRampTypes'

const pluginId = 'moonpay'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/moonpay_symbol_prp.png`
const pluginDisplayName = 'Moonpay'
const supportEmail = 'support@moonpay.com'

// Local asset map type
interface AssetMap {
  providerId: string
  fiat: Record<string, any>
  crypto: Record<string, ProviderToken[]>
}

const MOONPAY_PAYMENT_TYPE_MAP: Partial<
  Record<FiatPaymentType, MoonpayPaymentMethod>
> = {
  applepay: 'credit_debit_card',
  credit: 'credit_debit_card',
  googlepay: 'credit_debit_card',
  ach: 'ach_bank_transfer',
  paypal: 'paypal',
  venmo: 'venmo',
  fasterpayments: 'gbp_bank_transfer'
}

const NETWORK_CODE_PLUGINID_MAP: StringMap = {
  algorand: 'algorand',
  arbitrum: 'arbitrum',
  avalanche_c_chain: 'avalanche',
  base: 'base',
  binance_smart_chain: 'binancesmartchain',
  bitcoin: 'bitcoin',
  bitcoin_cash: 'bitcoincash',
  cardano: 'cardano',
  cosmos: 'cosmoshub',
  dogecoin: 'dogecoin',
  ethereum: 'ethereum',
  hedera: 'hedera',
  litecoin: 'litecoin',
  optimism: 'optimism',
  osmosis: 'osmosis',
  polygon: 'polygon',
  ripple: 'ripple',
  solana: 'solana',
  s_sonic: 'sonic',
  stellar: 'stellar',
  sui: 'sui',
  tezos: 'tezos',
  tron: 'tron',
  ton: 'ton',
  zksync: 'zksync'
}

const ensureIsoPrefix = (currencyCode: string): string => {
  return currencyCode.startsWith('iso:') ? currencyCode : `iso:${currencyCode}`
}

const createMemo = (pluginId: string, value: string): EdgeMemo => {
  const memo: EdgeMemo = {
    type: 'text',
    value,
    hidden: true
  }

  switch (pluginId) {
    case 'ripple': {
      memo.type = 'number'
      memo.memoName = 'destination tag'
    }
  }
  return memo
}

// Cache structure with TTL
interface ProviderConfigCache {
  data: {
    allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions>
    allowedCurrencyCodes: Record<
      FiatDirection,
      Partial<Record<FiatPaymentType, AssetMap>>
    >
  }
  timestamp: number
}

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes in milliseconds

export const moonpayRampPlugin: RampPluginFactory = (
  pluginConfig: RampPluginConfig
): RampPlugin => {
  const { account, navigation, onLogEvent } = pluginConfig
  const initOptions = asInitOptions(pluginConfig.initOptions)
  const { apiKey, apiUrl, buyWidgetUrl, sellWidgetUrl } = initOptions
  if (apiKey == null) throw new Error('Moonpay missing apiKey')

  // Cache variable scoped to the plugin instance
  let providerCache: ProviderConfigCache | null = null

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  // Internal function to fetch and cache provider configuration
  const fetchProviderConfig = async (): Promise<
    ProviderConfigCache['data']
  > => {
    // Check if cache is valid
    if (
      providerCache != null &&
      Date.now() - providerCache.timestamp < CACHE_TTL
    ) {
      return providerCache.data
    }

    // Initialize fresh configuration
    const freshConfig: ProviderConfigCache['data'] = {
      allowedCountryCodes: { buy: {}, sell: {} },
      allowedCurrencyCodes: {
        buy: {
          ach: { providerId: pluginId, fiat: {}, crypto: {} },
          applepay: { providerId: pluginId, fiat: {}, crypto: {} },
          credit: { providerId: pluginId, fiat: {}, crypto: {} },
          googlepay: { providerId: pluginId, fiat: {}, crypto: {} },
          paypal: { providerId: pluginId, fiat: {}, crypto: {} },
          venmo: { providerId: pluginId, fiat: {}, crypto: {} }
        },
        sell: {
          ach: { providerId: pluginId, fiat: {}, crypto: {} },
          credit: { providerId: pluginId, fiat: {}, crypto: {} },
          paypal: { providerId: pluginId, fiat: {}, crypto: {} },
          venmo: { providerId: pluginId, fiat: {}, crypto: {} },
          fasterpayments: { providerId: pluginId, fiat: {}, crypto: {} }
        }
      }
    }

    // Fetch currencies
    const currenciesResponse = await fetch(
      `${apiUrl}/v3/currencies?apiKey=${apiKey}`
    ).catch(() => undefined)

    if (currenciesResponse?.ok === true) {
      const result = await currenciesResponse.json()
      let moonpayCurrencies = asMoonpayCurrencies(result)

      // Fix burn address
      moonpayCurrencies = moonpayCurrencies.map(currency => {
        if (
          currency.metadata?.contractAddress ===
          '0x0000000000000000000000000000000000000000'
        ) {
          currency.metadata.contractAddress = null
        }
        return currency
      })

      // Process currencies
      for (const currency of moonpayCurrencies) {
        if (currency.type === 'crypto') {
          const { metadata } = currency
          if (metadata == null) continue
          const { contractAddress, networkCode } = metadata
          const currencyPluginId = NETWORK_CODE_PLUGINID_MAP[networkCode]
          if (currencyPluginId == null) continue

          let tokenId: EdgeTokenId
          if (contractAddress != null) {
            const resolved = findTokenIdByNetworkLocation({
              account,
              pluginId: currencyPluginId,
              networkLocation: { contractAddress }
            })
            if (resolved === undefined) continue // not found
            tokenId = resolved
          } else {
            // Native asset for this network
            tokenId = null
          }

          // Add to all payment types
          for (const dir of ['buy', 'sell'] as FiatDirection[]) {
            if (dir === 'sell' && currency.isSellSupported !== true) continue

            for (const pt in freshConfig.allowedCurrencyCodes[dir]) {
              const assetMap =
                freshConfig.allowedCurrencyCodes[dir][pt as FiatPaymentType]
              if (assetMap != null) {
                assetMap.crypto[currencyPluginId] ??= []
                addTokenToArray(
                  { tokenId, otherInfo: currency },
                  assetMap.crypto[currencyPluginId]
                )
              }
            }
          }
        } else {
          // Add fiat to all payment types
          for (const dir of ['buy', 'sell'] as FiatDirection[]) {
            for (const pt in freshConfig.allowedCurrencyCodes[dir]) {
              const assetMap =
                freshConfig.allowedCurrencyCodes[dir][pt as FiatPaymentType]
              if (assetMap != null) {
                assetMap.fiat['iso:' + currency.code.toUpperCase()] = currency
              }
            }
          }
        }
      }
    }

    // Fetch countries
    const countriesResponse = await fetch(
      `${apiUrl}/v3/countries?apiKey=${apiKey}`
    ).catch(() => undefined)

    if (countriesResponse?.ok === true) {
      const result = await countriesResponse.json()
      const countries = asMoonpayCountries(result)

      for (const country of countries) {
        if (country.isAllowed) {
          if (country.states == null) {
            if (country.isBuyAllowed) {
              freshConfig.allowedCountryCodes.buy[country.alpha2] = true
            }
            if (country.isSellAllowed) {
              freshConfig.allowedCountryCodes.sell[country.alpha2] = true
            }
          } else {
            const countryCode = country.alpha2
            for (const state of country.states) {
              if (state.isAllowed) {
                const stateProvinceCode = state.code
                if (state.isBuyAllowed) {
                  addExactRegion(
                    freshConfig.allowedCountryCodes.buy,
                    countryCode,
                    stateProvinceCode
                  )
                }
                if (state.isSellAllowed) {
                  addExactRegion(
                    freshConfig.allowedCountryCodes.sell,
                    countryCode,
                    stateProvinceCode
                  )
                }
              }
            }
          }
        }
      }
    }

    // Update cache
    providerCache = {
      data: freshConfig,
      timestamp: Date.now()
    }

    return freshConfig
  }

  // Helper function to check if region is supported
  const isRegionSupported = (
    regionCode: FiatPluginRegionCode,
    direction: FiatDirection,
    allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions>
  ): boolean => {
    try {
      validateExactRegion(pluginId, regionCode, allowedCountryCodes[direction])
      return true
    } catch {
      return false
    }
  }

  // Helper function to check if crypto asset is supported
  const isCryptoSupported = (
    pluginId: string,
    tokenId: EdgeTokenId,
    assetMap: AssetMap,
    regionCode?: FiatPluginRegionCode
  ): ProviderToken | null => {
    const tokens = assetMap.crypto[pluginId]
    if (tokens == null) {
      return null
    }

    const token = tokens.find(
      (token: ProviderToken) => token.tokenId === tokenId
    )
    if (token == null) {
      return null
    }

    // Check if currency is suspended
    const currency = asMoonpayCurrency(token.otherInfo)
    if (currency.isSuspended === true) {
      return null
    }

    // Check US region support
    if (
      regionCode?.countryCode === 'US' &&
      currency.isSupportedInUS === false
    ) {
      return null
    }

    return token
  }

  // Helper function to check if fiat is supported
  const isFiatSupported = (
    fiatCurrencyCode: string,
    assetMap: AssetMap
  ): MoonpayCurrency | null => {
    const fiatCurrencyObj = assetMap.fiat[fiatCurrencyCode]
    if (fiatCurrencyObj == null) {
      return null
    }

    try {
      return asMoonpayCurrency(fiatCurrencyObj)
    } catch {
      return null
    }
  }

  // Helper function to get supported payment methods
  const getSupportedPaymentMethods = (
    direction: FiatDirection,
    allowedCurrencyCodes: Record<
      FiatDirection,
      Partial<Record<FiatPaymentType, AssetMap>>
    >
  ): Array<{
    paymentType: FiatPaymentType
    paymentMethod: MoonpayPaymentMethod
    assetMap: AssetMap
  }> => {
    const supportedMethods: Array<{
      paymentType: FiatPaymentType
      paymentMethod: MoonpayPaymentMethod
      assetMap: AssetMap
    }> = []

    const paymentTypes = Object.keys(allowedCurrencyCodes[direction]).filter(
      pt => allowedCurrencyCodes[direction][pt as FiatPaymentType] != null
    ) as FiatPaymentType[]

    for (const paymentType of paymentTypes) {
      const paymentMethod = MOONPAY_PAYMENT_TYPE_MAP[paymentType]
      const assetMap = allowedCurrencyCodes[direction][paymentType]

      if (paymentMethod != null && assetMap != null) {
        supportedMethods.push({ paymentType, paymentMethod, assetMap })
      }
    }

    return supportedMethods
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const {
        direction,
        regionCode,
        fiatAsset: { currencyCode: fiatCurrencyCode },
        cryptoAsset: { pluginId: cryptoPluginId, tokenId }
      } = request

      // Fetch provider configuration (with caching)
      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes } = config

      // Get supported payment methods
      const supportedMethods = getSupportedPaymentMethods(
        direction,
        allowedCurrencyCodes
      )
      if (supportedMethods.length === 0) {
        return { supported: false }
      }

      // Get supported payment methods
      const paymentTypes = supportedMethods.map(method => method.paymentType)
      // Global constraints pre-check
      const constraintOk = validateRampCheckSupportRequest(
        pluginId,
        request,
        paymentTypes
      )
      if (!constraintOk) return { supported: false }

      // Check region support
      if (!isRegionSupported(regionCode, direction, allowedCountryCodes)) {
        return { supported: false }
      }

      // Check support across all payment methods
      for (const { assetMap } of supportedMethods) {
        // Check crypto support
        const cryptoSupported = isCryptoSupported(
          cryptoPluginId,
          tokenId,
          assetMap,
          regionCode
        )
        if (cryptoSupported == null) {
          continue
        }

        // Check fiat support
        const fiatSupported = isFiatSupported(
          ensureIsoPrefix(fiatCurrencyCode),
          assetMap
        )
        if (fiatSupported == null) {
          continue
        }

        // If we found a payment method that supports both crypto and fiat, return supported
        return { supported: true }
      }

      // No payment method supports this combination
      return { supported: false }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const { direction, regionCode, displayCurrencyCode, tokenId } = request
      const fiatCurrencyCode = ensureIsoPrefix(request.fiatCurrencyCode)

      const isMaxAmount =
        typeof request.exchangeAmount === 'object' && request.exchangeAmount.max
      const exchangeAmountString =
        typeof request.exchangeAmount === 'object' ? '' : request.exchangeAmount

      // Fetch provider configuration (with caching)
      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes } = config

      // Check region support
      if (!isRegionSupported(regionCode, direction, allowedCountryCodes)) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted'
        })
      }

      // Get supported payment methods
      const supportedPaymentMethods = getSupportedPaymentMethods(
        direction,
        allowedCurrencyCodes
      )

      if (supportedPaymentMethods.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'paymentUnsupported'
        })
      }

      // Build list of payment methods that support both fiat and crypto
      const methodCandidates: Array<{
        paymentType: FiatPaymentType
        paymentMethod: MoonpayPaymentMethod
        assetMap: AssetMap
        moonpayCurrency: ProviderToken
        fiatCurrencyObj: MoonpayCurrency
      }> = []

      for (const method of supportedPaymentMethods) {
        const cryptoSupported = isCryptoSupported(
          request.wallet.currencyInfo.pluginId,
          request.tokenId,
          method.assetMap,
          regionCode
        )
        if (cryptoSupported == null) continue

        const fiatSupported = isFiatSupported(fiatCurrencyCode, method.assetMap)
        if (fiatSupported == null) continue

        const constraintOk = validateRampQuoteRequest(
          pluginId,
          request,
          method.paymentType
        )
        if (!constraintOk) continue

        methodCandidates.push({
          paymentType: method.paymentType,
          paymentMethod: method.paymentMethod,
          assetMap: method.assetMap,
          moonpayCurrency: cryptoSupported,
          fiatCurrencyObj: fiatSupported
        })
      }

      // If no payment method supports both crypto and fiat, throw error
      if (methodCandidates.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const displayFiatCurrencyCode = removeIsoPrefix(fiatCurrencyCode)
      const fiatCode = removeIsoPrefix(fiatCurrencyCode).toLowerCase()
      const walletAddress = (
        await request.wallet.getAddresses({ tokenId: null })
      )[0].publicAddress
      const walletAddressParam =
        walletAddress == null ? '' : `&walletAddress=${walletAddress}`

      const quotes: RampQuote[] = []

      for (const candidate of methodCandidates) {
        const { paymentType, paymentMethod, moonpayCurrency, fiatCurrencyObj } =
          candidate

        try {
          const cryptoCurrencyObj = asMoonpayCurrency(moonpayCurrency.otherInfo)
          if (cryptoCurrencyObj == null) {
            continue
          }

          let maxFiat: number
          let minFiat: number
          let maxCrypto: number
          let minCrypto: number

          if (direction === 'buy') {
            maxFiat =
              fiatCurrencyObj.maxBuyAmount ?? fiatCurrencyObj.maxAmount ?? 0
            minFiat =
              fiatCurrencyObj.minBuyAmount ??
              fiatCurrencyObj.minAmount ??
              Infinity
            maxCrypto =
              cryptoCurrencyObj.maxBuyAmount ?? cryptoCurrencyObj.maxAmount ?? 0
            minCrypto =
              cryptoCurrencyObj.minBuyAmount ??
              cryptoCurrencyObj.minAmount ??
              Infinity
          } else {
            maxFiat =
              fiatCurrencyObj.maxSellAmount ?? fiatCurrencyObj.maxAmount ?? 0
            minFiat =
              fiatCurrencyObj.minSellAmount ??
              fiatCurrencyObj.minAmount ??
              Infinity
            maxCrypto =
              cryptoCurrencyObj.maxSellAmount ??
              cryptoCurrencyObj.maxAmount ??
              0
            minCrypto =
              cryptoCurrencyObj.minSellAmount ??
              cryptoCurrencyObj.minAmount ??
              Infinity
          }

          let exchangeAmount: number
          if (isMaxAmount) {
            exchangeAmount = request.amountType === 'fiat' ? maxFiat : maxCrypto
          } else {
            exchangeAmount = parseFloat(exchangeAmountString)
          }

          if (!isMaxAmount) {
            if (request.amountType === 'fiat') {
              if (exchangeAmount > maxFiat) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'overLimit',
                  errorAmount: maxFiat,
                  displayCurrencyCode: displayFiatCurrencyCode
                })
              }
              if (exchangeAmount < minFiat) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'underLimit',
                  errorAmount: minFiat,
                  displayCurrencyCode: displayFiatCurrencyCode
                })
              }
            } else {
              if (exchangeAmount > maxCrypto) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'overLimit',
                  errorAmount: maxCrypto,
                  displayCurrencyCode
                })
              }
              if (exchangeAmount < minCrypto) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'underLimit',
                  errorAmount: minCrypto,
                  displayCurrencyCode
                })
              }
            }
          }

          let amountParam = ''
          if (request.amountType === 'fiat') {
            if (direction === 'buy') {
              amountParam = `baseCurrencyAmount=${exchangeAmount}`
            } else {
              amountParam = `quoteCurrencyAmount=${exchangeAmount}`
            }
          } else {
            if (direction === 'buy') {
              amountParam = `quoteCurrencyAmount=${exchangeAmount}`
            } else {
              amountParam = `baseCurrencyAmount=${exchangeAmount}`
            }
          }

          let url
          if (direction === 'buy') {
            url = `${apiUrl}/v3/currencies/${cryptoCurrencyObj.code}/buy_quote/?apiKey=${apiKey}&quoteCurrencyCode=${cryptoCurrencyObj.code}&baseCurrencyCode=${fiatCode}&paymentMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}${walletAddressParam}`
          } else {
            url = `${apiUrl}/v3/currencies/${cryptoCurrencyObj.code}/sell_quote/?apiKey=${apiKey}&quoteCurrencyCode=${fiatCode}&payoutMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}`
          }

          const response = await fetch(url).catch((e: unknown) => {
            throw new Error(`Moonpay failed to fetch quote: ${String(e)}`)
          })

          if (!response.ok) {
            const errorJson = await response.json()
            const errorMessage = asMaybe(asString)(errorJson?.message)

            if (
              errorMessage?.includes(
                `is not supported for ${fiatCode.toLowerCase()}`
              ) === true
            ) {
              // Skip unsupported fiat/payment method combinations
              continue
            }
            throw new Error(
              `Moonpay failed to fetch quote: ${errorJson.message}`
            )
          }

          const result = await response.json()
          const moonpayQuote = asMoonpayQuote(result)

          const fiatAmount =
            'totalAmount' in moonpayQuote
              ? moonpayQuote.totalAmount.toString()
              : moonpayQuote.quoteCurrencyAmount.toString()
          const cryptoAmount =
            direction === 'buy'
              ? moonpayQuote.quoteCurrencyAmount.toString()
              : moonpayQuote.baseCurrencyAmount.toString()

          const quote: RampQuote = {
            pluginId,
            partnerIcon,
            pluginDisplayName,
            displayCurrencyCode: request.displayCurrencyCode,
            isEstimate: false,
            fiatCurrencyCode,
            fiatAmount,
            cryptoAmount,
            direction: request.direction,
            expirationDate: new Date(Date.now() + 8000),
            regionCode,
            paymentType,
            settlementRange: getSettlementRange(paymentType, request.direction),
            approveQuote: async (
              approveParams: RampApproveQuoteParams
            ): Promise<void> => {
              const { coreWallet } = approveParams
              const addresses = await coreWallet.getAddresses({ tokenId: null })
              const receiveAddress = addresses[0]

              if (direction === 'buy') {
                const urlObj = new URL(`${buyWidgetUrl}?`, true)
                const queryObj: MoonpayBuyWidgetQueryParams = {
                  apiKey,
                  walletAddress: receiveAddress.publicAddress,
                  currencyCode: cryptoCurrencyObj.code,
                  paymentMethod,
                  baseCurrencyCode: fiatCurrencyObj.code,
                  lockAmount: true,
                  showAllCurrencies: false,
                  enableRecurringBuys: false,
                  redirectURL: `https://deep.edge.app/ramp/buy/moonpay`
                }
                if (request.amountType === 'crypto') {
                  queryObj.quoteCurrencyAmount =
                    moonpayQuote.quoteCurrencyAmount
                } else {
                  queryObj.baseCurrencyAmount =
                    'totalAmount' in moonpayQuote
                      ? moonpayQuote.totalAmount
                      : undefined
                }
                urlObj.set('query', queryObj)
                console.log('Approving moonpay buy quote url=' + urlObj.href)

                await openExternalWebView({
                  url: urlObj.href,
                  deeplink: {
                    direction: 'buy',
                    providerId: pluginId,
                    handler: async link => {
                      const { query, uri } = link
                      console.log('Moonpay WebView launch buy success: ' + uri)
                      const { transactionId, transactionStatus } = query
                      if (transactionId == null || transactionStatus == null) {
                        return
                      }
                      if (transactionStatus !== 'pending') {
                        return
                      }

                      onLogEvent('Buy_Success', {
                        conversionValues: {
                          conversionType: 'buy',
                          sourceFiatCurrencyCode: fiatCurrencyCode,
                          sourceFiatAmount: fiatAmount,
                          destAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            currencyCode: displayCurrencyCode,
                            exchangeAmount: cryptoAmount
                          }),
                          fiatProviderId: pluginId,
                          orderId: transactionId
                        }
                      })

                      const message =
                        sprintf(
                          lstrings.fiat_plugin_buy_complete_message_s,
                          cryptoAmount,
                          displayCurrencyCode,
                          fiatAmount,
                          displayFiatCurrencyCode,
                          '1'
                        ) +
                        '\n\n' +
                        sprintf(
                          lstrings.fiat_plugin_buy_complete_message_2_hour_s,
                          '1'
                        ) +
                        '\n\n' +
                        lstrings.fiat_plugin_sell_complete_message_3

                      await showButtonsModal({
                        buttons: {
                          ok: { label: lstrings.string_ok, type: 'primary' }
                        },
                        title: lstrings.fiat_plugin_buy_complete_title,
                        message
                      })
                    }
                  }
                })
              } else {
                const urlObj = new URL(`${sellWidgetUrl}?`, true)
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
                if (request.amountType === 'crypto') {
                  queryObj.baseCurrencyAmount = moonpayQuote.baseCurrencyAmount
                } else {
                  queryObj.quoteCurrencyAmount =
                    moonpayQuote.quoteCurrencyAmount
                }
                urlObj.set('query', queryObj)
                console.log('Approving moonpay sell quote url=' + urlObj.href)

                let inPayment = false

                const openWebView = async (): Promise<void> => {
                  await new Promise<void>((resolve, reject) => {
                    navigation.navigate('guiPluginWebView', {
                      url: urlObj.href,
                      onUrlChange: async (uri: string): Promise<void> => {
                        console.log('Moonpay WebView url change: ' + uri)

                        if (uri.startsWith(RETURN_URL_PAYMENT)) {
                          console.log('Moonpay WebView launch payment: ' + uri)
                          const urlObj = new URL(uri, true)
                          const { query } = urlObj
                          const {
                            baseCurrencyAmount,
                            baseCurrencyCode,
                            depositWalletAddress,
                            depositWalletAddressTag,
                            transactionId
                          } = query

                          if (inPayment) return
                          inPayment = true

                          try {
                            if (
                              baseCurrencyAmount == null ||
                              baseCurrencyCode == null ||
                              depositWalletAddress == null ||
                              transactionId == null
                            ) {
                              throw new Error('Moonpay missing parameters')
                            }

                            const nativeAmount = mul(
                              baseCurrencyAmount,
                              getCurrencyCodeMultiplier(
                                coreWallet.currencyConfig,
                                displayCurrencyCode
                              )
                            )

                            const assetAction: EdgeAssetAction = {
                              assetActionType: 'sell'
                            }
                            const savedAction: EdgeTxActionFiat = {
                              actionType: 'fiat',
                              orderId: transactionId,
                              orderUri: `${sellWidgetUrl}/transaction_receipt?transactionId=${transactionId}`,
                              isEstimate: true,
                              fiatPlugin: {
                                providerId: pluginId,
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
                                createMemo(
                                  coreWallet.currencyInfo.pluginId,
                                  depositWalletAddressTag
                                )
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
                              },
                              onDone: async (error, tx): Promise<void> => {
                                if (error != null) {
                                  throw error
                                }
                                if (tx == null) {
                                  throw new Error(SendErrorNoTransaction)
                                }

                                onLogEvent('Sell_Success', {
                                  conversionValues: {
                                    conversionType: 'sell',
                                    destFiatCurrencyCode: fiatCurrencyCode,
                                    destFiatAmount: fiatAmount,
                                    sourceAmount: new CryptoAmount({
                                      currencyConfig: coreWallet.currencyConfig,
                                      currencyCode: displayCurrencyCode,
                                      exchangeAmount: baseCurrencyAmount
                                    }),
                                    fiatProviderId: pluginId,
                                    orderId: transactionId
                                  }
                                })

                                if (tokenId != null) {
                                  const params: SaveTxActionParams = {
                                    walletId: coreWallet.id,
                                    tokenId,
                                    txid: tx.txid,
                                    savedAction,
                                    assetAction: {
                                      ...assetAction,
                                      assetActionType: 'sell'
                                    }
                                  }
                                  await coreWallet.saveTxAction({
                                    txid: params.txid,
                                    tokenId: params.tokenId,
                                    assetAction: params.assetAction,
                                    savedAction: params.savedAction
                                  })
                                }

                                navigation.pop()

                                const message =
                                  sprintf(
                                    lstrings.fiat_plugin_sell_complete_message_s,
                                    cryptoAmount,
                                    displayCurrencyCode,
                                    fiatAmount,
                                    displayFiatCurrencyCode,
                                    '1'
                                  ) +
                                  '\n\n' +
                                  sprintf(
                                    lstrings.fiat_plugin_sell_complete_message_2_hour_s,
                                    '1'
                                  ) +
                                  '\n\n' +
                                  lstrings.fiat_plugin_sell_complete_message_3

                                await showButtonsModal({
                                  buttons: {
                                    ok: {
                                      label: lstrings.string_ok,
                                      type: 'primary'
                                    }
                                  },
                                  title:
                                    lstrings.fiat_plugin_sell_complete_title,
                                  message
                                })
                                resolve()
                              },
                              onBack: () => {
                                reject(new Error(SendErrorBackPressed))
                              }
                            }

                            navigation.navigate('send2', sendParams)
                          } catch (e: unknown) {
                            navigation.pop()
                            await openWebView()

                            if (
                              e instanceof Error &&
                              e.message === SendErrorNoTransaction
                            ) {
                              showToast(
                                lstrings.fiat_plugin_sell_failed_to_send_try_again,
                                NOT_SUCCESS_TOAST_HIDE_MS
                              )
                            } else if (
                              e instanceof Error &&
                              e.message === SendErrorBackPressed
                            ) {
                              // Do nothing
                            } else {
                              showError(e)
                            }
                          } finally {
                            inPayment = false
                          }
                        }
                      }
                    })
                  })
                }
                await openWebView()
              }
            },
            closeQuote: async (): Promise<void> => {
              rampDeeplinkManager.unregister()
            }
          }
          quotes.push(quote)
        } catch (e) {
          // TODO: Instead of a for-loop and try-catch, we need to track all
          // of these errors and return them in the response somehow. This way
          // they make their way up to the caller for display or logging.
          console.warn(`Moonpay: Failed to get quote for ${paymentType}:`, e)
        }
      }

      return quotes
    }
  }

  return plugin
}
