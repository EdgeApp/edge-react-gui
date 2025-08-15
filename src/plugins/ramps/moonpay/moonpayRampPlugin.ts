import { mul } from 'biggystring'
import type {
  EdgeAssetAction,
  EdgeMemo,
  EdgeSpendInfo,
  EdgeTokenId,
  EdgeTxActionFiat
} from 'edge-core-js'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'
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
import { getCurrencyCodeMultiplier } from '../../../util/CurrencyInfoHelpers'
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
  RampQuoteRequest,
  RampQuoteResult,
  RampSupportResult
} from '../rampPluginTypes'
import {
  asInitOptions,
  asMoonpayCountries,
  asMoonpayCurrencies,
  asMoonpayCurrency,
  asMoonpayQuote,
  type MoonpayBuyWidgetQueryParams,
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
  venmo: 'venmo'
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
  const { navigation, onLogEvent } = pluginConfig
  const initOptions = asInitOptions(pluginConfig.initOptions)
  const { apiKey } = initOptions
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
          credit: { providerId: pluginId, fiat: {}, crypto: {} },
          paypal: { providerId: pluginId, fiat: {}, crypto: {} },
          venmo: { providerId: pluginId, fiat: {}, crypto: {} }
        },
        sell: {
          ach: { providerId: pluginId, fiat: {}, crypto: {} },
          credit: { providerId: pluginId, fiat: {}, crypto: {} },
          paypal: { providerId: pluginId, fiat: {}, crypto: {} },
          venmo: { providerId: pluginId, fiat: {}, crypto: {} }
        }
      }
    }

    // Fetch currencies
    const currenciesResponse = await fetch(
      `https://api.moonpay.com/v3/currencies?apiKey=${apiKey}`
    ).catch(() => undefined)

    if (currenciesResponse?.ok) {
      try {
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

            const tokenId: EdgeTokenId =
              contractAddress != null ? contractAddress : null

            // Add to all payment types
            for (const dir of ['buy', 'sell'] as FiatDirection[]) {
              if (dir === 'sell' && currency.isSellSupported !== true) continue

              for (const pt in freshConfig.allowedCurrencyCodes[dir]) {
                const assetMap =
                  freshConfig.allowedCurrencyCodes[dir][pt as FiatPaymentType]
                if (assetMap != null) {
                  if (assetMap.crypto[currencyPluginId] == null) {
                    assetMap.crypto[currencyPluginId] = []
                  }
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
      } catch (error) {
        console.log('Failed to update moonpay currencies:', error)
      }
    }

    // Fetch countries
    const countriesResponse = await fetch(
      `https://api.moonpay.com/v3/countries?apiKey=${apiKey}`
    ).catch(() => undefined)

    if (countriesResponse?.ok) {
      try {
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
      } catch (error) {
        console.log('Failed to update moonpay countries:', error)
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
    // Check country restrictions
    if (regionCode.countryCode === 'GB') {
      return false
    }

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
    if (!tokens) {
      return null
    }

    const token = tokens.find(
      (token: ProviderToken) => token.tokenId === tokenId
    )
    if (!token) {
      return null
    }

    // Check if currency is suspended
    const currency = asMoonpayCurrency(token.otherInfo)
    if (currency.isSuspended) {
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
  ): any | null => {
    const fiatCurrencyObj = assetMap.fiat[fiatCurrencyCode]
    if (!fiatCurrencyObj) {
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

      if (paymentMethod && assetMap) {
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

      try {
        // Fetch provider configuration (with caching)
        const config = await fetchProviderConfig()
        const { allowedCountryCodes, allowedCurrencyCodes } = config

        // Check region support
        if (!isRegionSupported(regionCode, direction, allowedCountryCodes)) {
          return { supported: false }
        }

        // Get supported payment methods
        const supportedMethods = getSupportedPaymentMethods(
          direction,
          allowedCurrencyCodes
        )
        if (supportedMethods.length === 0) {
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
          if (!cryptoSupported) {
            continue
          }

          // Check fiat support
          const fiatSupported = isFiatSupported(
            ensureIsoPrefix(fiatCurrencyCode),
            assetMap
          )
          if (!fiatSupported) {
            continue
          }

          // If we found a payment method that supports both crypto and fiat, return supported
          return { supported: true }
        }

        // No payment method supports this combination
        return { supported: false }
      } catch (error) {
        console.log('Moonpay checkSupport error:', error)
        // For any errors, return not supported rather than throwing
        return { supported: false }
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      const { direction, regionCode, displayCurrencyCode, tokenId } = request
      const fiatCurrencyCode = ensureIsoPrefix(request.fiatCurrencyCode)

      const isMaxAmount =
        typeof request.exchangeAmount === 'object' && request.exchangeAmount.max
      const exchangeAmountString = isMaxAmount
        ? ''
        : (request.exchangeAmount as string)

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

      // Find the first payment method that supports both crypto and fiat
      let selectedMethod: {
        paymentType: FiatPaymentType
        paymentMethod: MoonpayPaymentMethod
        assetMap: AssetMap
        moonpayCurrency: ProviderToken
        fiatCurrencyObj: any
      } | null = null

      for (const method of supportedPaymentMethods) {
        // Check if crypto is supported
        const cryptoSupported = isCryptoSupported(
          request.pluginId,
          request.tokenId,
          method.assetMap,
          regionCode
        )
        if (!cryptoSupported) {
          continue
        }

        // Check if fiat is supported
        const fiatSupported = isFiatSupported(fiatCurrencyCode, method.assetMap)
        if (!fiatSupported) {
          continue
        }

        // Found a payment method that supports both
        selectedMethod = {
          paymentType: method.paymentType,
          paymentMethod: method.paymentMethod,
          assetMap: method.assetMap,
          moonpayCurrency: cryptoSupported,
          fiatCurrencyObj: fiatSupported
        }
        break
      }

      // If no payment method supports both crypto and fiat, throw error
      if (selectedMethod == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const { paymentType, paymentMethod, moonpayCurrency, fiatCurrencyObj } =
        selectedMethod

      const cryptoCurrencyObj = asMoonpayCurrency(moonpayCurrency.otherInfo)
      if (!cryptoCurrencyObj) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      let amountParam = ''

      let maxFiat: number
      let minFiat: number
      let maxCrypto: number
      let minCrypto: number

      if (direction === 'buy') {
        maxFiat = fiatCurrencyObj.maxBuyAmount ?? fiatCurrencyObj.maxAmount ?? 0
        minFiat =
          fiatCurrencyObj.minBuyAmount ?? fiatCurrencyObj.minAmount ?? Infinity
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
          fiatCurrencyObj.minSellAmount ?? fiatCurrencyObj.minAmount ?? Infinity
        maxCrypto =
          cryptoCurrencyObj.maxSellAmount ?? cryptoCurrencyObj.maxAmount ?? 0
        minCrypto =
          cryptoCurrencyObj.minSellAmount ??
          cryptoCurrencyObj.minAmount ??
          Infinity
      }

      let exchangeAmount: number
      if (isMaxAmount) {
        // Use the max amounts based on amountType
        exchangeAmount = request.amountType === 'fiat' ? maxFiat : maxCrypto
      } else {
        exchangeAmount = parseFloat(exchangeAmountString)
      }

      const displayFiatCurrencyCode = removeIsoPrefix(fiatCurrencyCode)
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

      const fiatCode = removeIsoPrefix(fiatCurrencyCode).toLowerCase()
      let url
      const walletAddress = (
        await request.wallet?.getAddresses({ tokenId: null })
      )?.[0]?.publicAddress
      const walletAddressParam =
        walletAddress == null ? '' : `&walletAddress=${walletAddress}`

      if (direction === 'buy') {
        url = `https://api.moonpay.com/v3/currencies/${cryptoCurrencyObj.code}/buy_quote/?apiKey=${apiKey}&quoteCurrencyCode=${cryptoCurrencyObj.code}&baseCurrencyCode=${fiatCode}&paymentMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}${walletAddressParam}`
      } else {
        url = `https://api.moonpay.com/v3/currencies/${cryptoCurrencyObj.code}/sell_quote/?apiKey=${apiKey}&quoteCurrencyCode=${fiatCode}&payoutMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}`
      }

      const response = await fetch(url).catch(e => {
        console.log(e)
        return undefined
      })

      if (response == null) {
        throw new Error('Moonpay failed to fetch quote: empty response')
      }

      if (!response.ok) {
        const errorJson = await response.json()

        if (
          errorJson?.message != null &&
          typeof errorJson.message === 'string' &&
          errorJson.message.includes(
            `is not supported for ${fiatCode.toLowerCase()}`
          )
        ) {
          throw new FiatProviderError({
            providerId: pluginId,
            errorType: 'fiatUnsupported',
            fiatCurrencyCode: fiatCode.toUpperCase(),
            paymentMethod,
            pluginDisplayName
          })
        }
        throw new Error(`Moonpay failed to fetch quote: ${errorJson.message}`)
      }

      const result = await response.json()
      const moonpayQuote = asMoonpayQuote(result)

      console.log('Got Moonpay quote')
      console.log(JSON.stringify(moonpayQuote, null, 2))

      const fiatAmount =
        'totalAmount' in moonpayQuote
          ? moonpayQuote.totalAmount.toString()
          : moonpayQuote.quoteCurrencyAmount.toString()
      const cryptoAmount =
        direction === 'buy'
          ? moonpayQuote.quoteCurrencyAmount.toString()
          : moonpayQuote.baseCurrencyAmount.toString()

      const quote: RampQuoteResult = {
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
        settlementRange: {
          min: { value: 1, unit: 'hours' },
          max: { value: 1, unit: 'hours' }
        },
        approveQuote: async (
          approveParams: RampApproveQuoteParams
        ): Promise<void> => {
          const { coreWallet } = approveParams
          const addresses = await coreWallet.getAddresses({ tokenId: null })
          const receiveAddress = addresses[0]

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
            if (request.amountType === 'crypto') {
              queryObj.quoteCurrencyAmount = moonpayQuote.quoteCurrencyAmount
            } else {
              queryObj.baseCurrencyAmount =
                'totalAmount' in moonpayQuote
                  ? moonpayQuote.totalAmount
                  : undefined
            }
            urlObj.set('query', queryObj)
            console.log('Approving moonpay buy quote url=' + urlObj.href)

            rampDeeplinkManager.register('buy', pluginId, async link => {
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
            })

            if (Platform.OS === 'ios') {
              await SafariView.show({ url: urlObj.href })
            } else {
              await CustomTabs.openURL(urlObj.href)
            }
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
            if (request.amountType === 'crypto') {
              queryObj.baseCurrencyAmount = moonpayQuote.baseCurrencyAmount
            } else {
              queryObj.quoteCurrencyAmount = moonpayQuote.quoteCurrencyAmount
            }
            urlObj.set('query', queryObj)
            console.log('Approving moonpay sell quote url=' + urlObj.href)

            let inPayment = false

            const openWebView = async (): Promise<void> => {
              await new Promise<void>((resolve, reject) => {
                navigation.navigate('guiPluginWebView', {
                  url: urlObj.href,
                  onUrlChange: async (uri: string) => {
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
                          orderUri: `https://sell.moonpay.com/transaction_receipt?transactionId=${transactionId}`,
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
                          onDone: async (error, tx) => {
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
                              title: lstrings.fiat_plugin_sell_complete_title,
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
      return [quote]
    }
  }

  return plugin
}
