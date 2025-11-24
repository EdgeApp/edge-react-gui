import { gt, lt } from 'biggystring'
import { Platform } from 'react-native'

import { showToast } from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { fetchInfo } from '../../../util/network'
import { makeUuid } from '../../../util/rnUtils'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import { addExactRegion, validateExactRegion } from '../../gui/providers/common'
import { addTokenToArray } from '../../gui/util/providerUtils'
import type {
  ProviderToken,
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
  asInfoJwtSignResponse,
  asInitOptions,
  asSimplexCountries,
  asSimplexFiatCurrencies,
  asSimplexFiatCurrency,
  asSimplexQuote,
  asSimplexQuoteSuccess,
  SIMPLEX_ERROR_TYPES,
  type SimplexJwtData,
  type SimplexQuoteJwtData
} from './simplexRampTypes'

const pluginId = 'simplex'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/simplex-logo-sm-square.png`
const pluginDisplayName = 'Simplex'
const NOT_SUCCESS_TOAST_HIDE_MS = 3000

// 24 hour TTL for provider config cache
const PROVIDER_CONFIG_TTL_MS = 24 * 60 * 60 * 1000

// https://integrations.simplex.com/docs/supported_currencies
const SIMPLEX_ID_MAP: Record<string, Record<string, string>> = {
  algorand: { ALGO: 'ALGO' },
  avalanche: { AVAX: 'AVAX-C' },
  binance: { AVA: 'AVA', BNB: 'BNB' },
  binancesmartchain: {
    BABYDOGE: 'BABYDOGE',
    BAKE: 'BAKE',
    BNB: 'BNB',
    BUSD: 'BUSD-SC',
    CAKE: 'CAKE',
    EGC: 'EGC',
    KMON: 'KMON',
    SATT: 'SATT-SC',
    TCT: 'TCT',
    ULTI: 'ULTI',
    USDC: 'USDC-SC',
    XVS: 'XVS'
  },
  bitcoin: { BTC: 'BTC' },
  bitcoincash: { BCH: 'BCH' },
  bitcoinsv: { BSV: 'BSV' },
  cardano: { ADA: 'ADA' },
  celo: { CELO: 'CELO', CEUR: 'CEUR', CUSD: 'CUSD' },
  digibyte: { DGB: 'DGB' },
  dogecoin: { DOGE: 'DOGE' },
  eos: { EOS: 'EOS' },
  ethereum: {
    '1EARTH': '1EARTH',
    AAVE: 'AAVE',
    AXS: 'AXS-ERC20',
    BAT: 'BAT',
    BUSD: 'BUSD',
    CEL: 'CEL',
    CHZ: 'CHZ',
    COMP: 'COMP',
    COTI: 'COTI-ERC20',
    CRO: 'CRO-ERC20',
    DAI: 'DAI',
    DEP: 'DEP',
    DFT: 'DFT',
    ELON: 'ELON',
    ENJ: 'ENJ',
    ETH: 'ETH',
    GALA: 'GALA',
    GHX: 'GHX',
    GMT: 'GMT-ERC20',
    GOVI: 'GOVI',
    HEDG: 'HEDG',
    HGOLD: 'HGOLD',
    HUSD: 'HUSD',
    KCS: 'KCS',
    LINK: 'LINK',
    MANA: 'MANA',
    MATIC: 'MATIC-ERC20',
    MKR: 'MKR',
    PEPE: 'PEPE',
    PRT: 'PRT',
    REVV: 'REVV',
    RFOX: 'RFOX',
    RFUEL: 'RFUEL',
    RLY: 'RLY-ERC20',
    SAND: 'SAND',
    SATT: 'SATT-ERC20',
    SHIB: 'SHIB',
    SUSHI: 'SUSHI',
    TRU: 'TRU',
    TUSD: 'TUSD',
    UNI: 'UNI',
    UOS: 'UOS-ERC20',
    USDC: 'USDC',
    USDK: 'USDK',
    USDP: 'USDP',
    USDT: 'USDT',
    VNDC: 'VNDC',
    WBTC: 'WBTC',
    XAUT: 'XAUT',
    XYO: 'XYO'
  },
  fantom: { FTM: 'FTM' },
  filecoin: { FIL: 'FIL' },
  hedera: { HBAR: 'HBAR' },
  litecoin: { LTC: 'LTC' },
  one: { ONE: 'ONE' },
  optimism: { ETH: 'ETH-OPTIMISM', OP: 'OP' },
  polkadot: { DOT: 'DOT' },
  polygon: { GMEE: 'GMEE', POL: 'POL', USDC: 'USDC-MATIC' },
  qtum: { QTUM: 'QTUM' },
  ravencoin: { RVN: 'RVN' },
  ripple: { XRP: 'XRP' },
  solana: { KIN: 'KIN', MELANIA: 'MELANIA', SOL: 'SOL', TRUMP: 'TRUMP' },
  stellar: { XLM: 'XLM' },
  sui: { SUI: 'SUI' },
  tezos: { XTZ: 'XTZ' },
  ton: { TON: 'TON', USDT: 'USDT-TON' },
  tron: {
    BTT: 'BTT',
    KLV: 'KLV',
    TRX: 'TRX',
    USDC: 'USDC-TRC20',
    USDT: 'USDT-TRC20'
  },
  wax: { WAX: 'WAXP' }
}

// Build quotes for supported payment methods (credit always, plus platform wallets)
const basePaymentTypes = ['credit'] as const
const platformPaymentTypes =
  Platform.OS === 'ios'
    ? (['applepay'] as const)
    : Platform.OS === 'android'
    ? (['googlepay'] as const)
    : ([] as const)
const paymentTypes = [...basePaymentTypes, ...platformPaymentTypes]

interface SimplexPluginState {
  partner: string
  jwtTokenProvider: string
  publicKey: string
  simplexUserId: string
}

interface ProviderConfig {
  crypto: Record<string, ProviderToken[]>
  fiat: Record<string, any>
  countries: Record<string, any>
  lastUpdated: number
}

export const simplexRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
) => {
  const initOptions = asInitOptions(config.initOptions)
  const { apiUrl, partnerApiUrl, widgetUrl } = initOptions
  const { navigation, onLogEvent } = config

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  let state: SimplexPluginState | undefined
  let providerConfig: ProviderConfig | undefined

  const ensureIsoPrefix = (currencyCode: string): string => {
    return currencyCode.startsWith('iso:')
      ? currencyCode
      : `iso:${currencyCode}`
  }

  const ensureStateInitialized = async (): Promise<void> => {
    if (state == null) {
      const { partner, jwtTokenProvider, publicKey } = initOptions

      let simplexUserId = await config.store
        .getItem('simplex_user_id')
        .catch(() => undefined)
      if (simplexUserId == null || simplexUserId === '') {
        simplexUserId = await makeUuid()
        await config.store.setItem('simplex_user_id', simplexUserId)
      }

      state = {
        partner,
        jwtTokenProvider,
        publicKey,
        simplexUserId
      }
    }
  }

  const fetchProviderConfig = async (): Promise<void> => {
    if (state == null) throw new Error('Plugin not initialized')
    const { publicKey } = state

    // Check cache TTL
    if (
      providerConfig != null &&
      Date.now() - providerConfig.lastUpdated < PROVIDER_CONFIG_TTL_MS
    ) {
      return
    }

    // Initialize new config
    const newConfig: ProviderConfig = {
      crypto: {},
      fiat: {},
      countries: {},
      lastUpdated: Date.now()
    }

    // Initialize crypto mappings
    for (const pluginId in SIMPLEX_ID_MAP) {
      const codesObject = SIMPLEX_ID_MAP[pluginId]
      // We need at least one supported currency in this plugin
      if (Object.keys(codesObject).length > 0) {
        newConfig.crypto[pluginId] ??= []
        const tokens = newConfig.crypto[pluginId]
        // For simplex, we just need to indicate that this plugin is supported
        // The actual tokenId mapping is handled by displayCurrencyCode matching
        addTokenToArray({ tokenId: null }, tokens)
      }
    }

    // Fetch supported fiat currencies
    const response = await fetch(
      `${apiUrl}/supported_fiat_currencies?public_key=${publicKey}`
    )
    if (!response?.ok) {
      throw new Error('Simplex: Failed to fetch supported fiat currencies')
    }
    const result = await response.json()

    const fiatCurrencies = asSimplexFiatCurrencies(result)
    for (const fc of fiatCurrencies) {
      newConfig.fiat['iso:' + fc.ticker_symbol] = fc
    }

    // Fetch supported countries
    const response2 = await fetch(
      `${apiUrl}/supported_countries?public_key=${publicKey}&payment_methods=credit_card`
    )
    if (!response2?.ok) {
      throw new Error('Simplex: Failed to fetch supported countries')
    }
    const result2 = await response2.json()
    const countries = asSimplexCountries(result2)

    for (const country of countries) {
      const [countryCode, stateProvinceCode] = country.split('-')
      addExactRegion(newConfig.countries, countryCode, stateProvinceCode)
    }

    // Update the cached config
    providerConfig = newConfig
  }

  const fetchJwtToken = async (
    endpoint: string,
    data: SimplexJwtData | SimplexQuoteJwtData
  ): Promise<string> => {
    const response = await fetchInfo(
      `v1/jwtSign/${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      },
      3000
    )
    if (!response?.ok) throw new Error('Simplex: Failed to fetch JWT token')
    const result = await response.json()
    const { token } = asInfoJwtSignResponse(result)
    return token
  }

  const validateDirection = (direction: 'buy' | 'sell'): boolean => {
    // Only support buy direction
    return direction === 'buy'
  }

  const validateRegion = (regionCode: {
    countryCode: string
    stateProvinceCode?: string
  }): boolean => {
    // GB is not supported
    if (regionCode.countryCode === 'GB') {
      return false
    }

    // Check exact region validation
    if (providerConfig == null) return false
    try {
      validateExactRegion(pluginId, regionCode, providerConfig.countries)
      return true
    } catch (error) {
      return false
    }
  }

  const validateCrypto = (
    currencyPluginId: string,
    displayCurrencyCode: string
  ): string | null => {
    // Check if crypto is supported
    const simplexCryptoCode =
      SIMPLEX_ID_MAP[currencyPluginId]?.[displayCurrencyCode]
    if (simplexCryptoCode == null) {
      return null
    }

    // Check if we have this crypto in our provider config
    if (providerConfig == null) return null
    const supportedTokens = providerConfig.crypto[currencyPluginId]
    if (supportedTokens == null || supportedTokens.length === 0) {
      return null
    }

    return simplexCryptoCode
  }

  const validateFiat = (fiatCurrencyCode: string): string | null => {
    // Check if fiat is supported
    if (providerConfig == null) return null
    const fiatInfo = providerConfig.fiat[fiatCurrencyCode]
    if (fiatInfo == null) {
      return null
    }

    const simplexFiatCode = asSimplexFiatCurrency(fiatInfo).ticker_symbol
    return simplexFiatCode
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const { direction, regionCode, fiatAsset, cryptoAsset } = request

      // Global constraints pre-check
      const constraintOk = validateRampCheckSupportRequest(
        pluginId,
        request,
        paymentTypes
      )
      if (!constraintOk) return { supported: false }

      // Validate direction
      if (!validateDirection(direction)) {
        return { supported: false }
      }

      // Initialize state and fetch provider config if needed
      await ensureStateInitialized()
      await fetchProviderConfig()

      // Ensure we have provider config
      if (providerConfig == null) {
        throw new Error('Simplex: Provider config not available')
      }

      // Validate region
      if (!validateRegion(regionCode)) {
        return { supported: false }
      }

      // For tokenId support, we need to get the display currency code
      // Since Simplex uses display currency codes, we'll need to check if the tokenId
      // matches any supported currency for the plugin
      let displayCurrencyCode: string | null = null

      /**
       * Simplex Token Support Limitation:
       *
       * Simplex only supports native currencies (where tokenId === null), not tokens,
       * due to fundamental limitations in their API architecture:
       *
       * 1. API Currency Code System:
       *    - Simplex uses their own proprietary currency codes (e.g., 'BTC', 'ETH', 'AVAX-C')
       *    - These codes map to native blockchain currencies, not token contract addresses
       *    - There's no mechanism in their API to specify token contracts
       *
       * 2. SIMPLEX_ID_MAP Structure:
       *    - Maps Edge plugin IDs and display currency codes to Simplex currency codes
       *    - Only contains entries for native currencies of each blockchain
       *    - Example: ethereum: { ETH: 'ETH' } but no mapping for ERC-20 tokens
       *
       * 3. Legacy Provider Comparison:
       *    - The old fiat provider architecture had a getTokenId method that could
       *      theoretically support tokens by returning contract addresses
       *    - However, even with that capability, Simplex's API never actually
       *      supported purchasing tokens - only native currencies
       *    - This plugin maintains the same limitation but makes it explicit
       *
       * Therefore, we must check tokenId === null to ensure only native currencies
       * are processed, returning unsupported for any token requests.
       */
      if (cryptoAsset.tokenId === null) {
        // Native currency - check if we have any mapping for this plugin
        const pluginMappings = SIMPLEX_ID_MAP[cryptoAsset.pluginId]
        if (pluginMappings != null && Object.keys(pluginMappings).length > 0) {
          // For checkSupport, we just need to know if the plugin is supported
          // The actual currency code mapping happens during quote
          displayCurrencyCode = Object.keys(pluginMappings)[0]
        }
      } else {
        // Simplex doesn't support tokens, only native currencies
        return { supported: false }
      }

      if (displayCurrencyCode === '') {
        return { supported: false }
      }

      // Validate crypto - we use any valid display code for the plugin
      const simplexCryptoCode =
        displayCurrencyCode != null
          ? validateCrypto(cryptoAsset.pluginId, displayCurrencyCode)
          : null
      if (simplexCryptoCode == null) {
        return { supported: false }
      }

      // Validate fiat - ensure 'iso:' prefix
      const simplexFiatCode = validateFiat(
        ensureIsoPrefix(fiatAsset.currencyCode)
      )
      if (simplexFiatCode == null) {
        return { supported: false }
      }

      // All validations passed
      return {
        supported: true,
        supportedAmountTypes: ['fiat', 'crypto']
      }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const {
        amountType,
        regionCode,
        fiatCurrencyCode,
        displayCurrencyCode,
        direction
      } = request
      const currencyPluginId = request.wallet.currencyInfo.pluginId

      const isMaxAmount =
        'max' in request.amountQuery ||
        'maxExchangeAmount' in request.amountQuery
      const exchangeAmount =
        `exchangeAmount` in request.amountQuery
          ? request.amountQuery.exchangeAmount
          : ''
      const maxAmountLimit =
        'maxExchangeAmount' in request.amountQuery
          ? request.amountQuery.maxExchangeAmount
          : undefined

      // Validate direction
      if (!validateDirection(direction)) {
        return []
      }

      // Initialize state and fetch provider config if needed
      await ensureStateInitialized()
      await fetchProviderConfig()

      // Ensure we have provider config
      if (providerConfig == null) {
        throw new Error('Simplex: Provider config not available')
      }

      // Validate region
      if (!validateRegion(regionCode)) {
        return []
      }

      // Validate crypto
      const simplexCryptoCode = validateCrypto(
        currencyPluginId,
        displayCurrencyCode
      )
      if (simplexCryptoCode == null) {
        return []
      }

      // Validate fiat - ensure 'iso:' prefix
      const simplexFiatCode = validateFiat(ensureIsoPrefix(fiatCurrencyCode))
      if (simplexFiatCode == null) {
        return []
      }

      // All checks passed, now fetch the actual quote
      if (state == null) throw new Error('Plugin state not initialized')

      // Prepare quote request
      const ts = Math.floor(Date.now() / 1000)
      let sourceCurrencyName: string
      let targetCurrencyName: string
      let sourceAmount: number

      if (isMaxAmount) {
        // Use reasonable max amounts
        sourceAmount = amountType === 'fiat' ? 50000 : 100

        if (amountType !== 'fiat' && maxAmountLimit != null) {
          const capValue = parseFloat(maxAmountLimit)
          if (isFinite(capValue)) {
            sourceAmount = Math.min(sourceAmount, capValue)
          }
        }
      } else {
        sourceAmount = parseFloat(exchangeAmount)
      }

      if (amountType === 'fiat') {
        sourceCurrencyName = simplexFiatCode
        targetCurrencyName = simplexCryptoCode
      } else {
        sourceCurrencyName = simplexCryptoCode
        targetCurrencyName = simplexFiatCode
      }

      const jwtData: SimplexQuoteJwtData = {
        euid: state.simplexUserId,
        ts,
        soam: sourceAmount,
        socn: sourceCurrencyName,
        tacn: targetCurrencyName
      }

      // Get JWT token
      const token = await fetchJwtToken('simplex', jwtData)

      // Fetch quote
      const url = `${partnerApiUrl}/api/quote?partner=${state.partner}&t=${token}`
      const response = await fetch(url)
      if (response == null) throw new Error('Simplex: Failed to fetch quote')

      const result = await response.json()
      const quote = asSimplexQuote(result)

      if ('error' in quote) {
        // Handle error cases
        if (
          quote.type === SIMPLEX_ERROR_TYPES.INVALID_AMOUNT_LIMIT ||
          quote.type === SIMPLEX_ERROR_TYPES.AMOUNT_LIMIT_EXCEEDED
        ) {
          const result = /The (.*) amount must be between (.*) and (.*)/.exec(
            quote.error
          )
          if (result != null && result.length >= 4) {
            const [, fiatCode, minLimit, maxLimit] = result
            const reqAmount = isMaxAmount
              ? sourceAmount.toString()
              : exchangeAmount
            if (gt(reqAmount, maxLimit)) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'overLimit',
                errorAmount: parseFloat(maxLimit),
                displayCurrencyCode: fiatCode
              })
            }
            if (lt(reqAmount, minLimit)) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'underLimit',
                errorAmount: parseFloat(minLimit),
                displayCurrencyCode: fiatCode
              })
            }
          }
        } else if (
          quote.type === SIMPLEX_ERROR_TYPES.QUOTE_ERROR &&
          quote.error.includes('fees for this transaction exceed')
        ) {
          throw new FiatProviderError({
            providerId: pluginId,
            errorType: 'underLimit'
          })
        }
        // For other errors, throw the error
        throw new Error(`Simplex quote error: ${quote.error}`)
      }

      const goodQuote = asSimplexQuoteSuccess(quote)
      const quoteFiatAmount = goodQuote.fiat_money.amount.toString()
      const quoteCryptoAmount = goodQuote.digital_money.amount.toString()

      // Simplex will return zero amounts quotes if they support an asset,
      // but the amount is below the minimum for some assets (e.g. FTM).
      if (quoteCryptoAmount === '0' || quoteFiatAmount === '0') {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'underLimit'
        })
      }

      const quotes: RampQuote[] = []
      for (const paymentType of paymentTypes) {
        // Constraints per request
        const constraintOk = validateRampQuoteRequest(
          pluginId,
          request,
          paymentType
        )
        if (!constraintOk) continue

        quotes.push({
          pluginId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode,
          cryptoAmount: quoteCryptoAmount,
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount: quoteFiatAmount,
          direction,
          expirationDate: new Date(Date.now() + 8000),
          regionCode,
          paymentType,
          settlementRange: getSettlementRange(paymentType, direction),
          approveQuote: async (
            params: RampApproveQuoteParams
          ): Promise<void> => {
            if (state == null) throw new Error('Plugin state not initialized')
            const { coreWallet } = params

            const receiveAddress = await coreWallet.getReceiveAddress({
              tokenId: null
            })

            const data: SimplexJwtData = {
              ts: Math.floor(Date.now() / 1000),
              euid: state.simplexUserId,
              crad: receiveAddress.publicAddress,
              crcn: simplexCryptoCode,
              ficn: simplexFiatCode,
              fiam: goodQuote.fiat_money.amount
            }

            const token = await fetchJwtToken(state.jwtTokenProvider, data)
            const url = `${widgetUrl}/?partner=${state.partner}&t=${token}`

            await openExternalWebView({
              url,
              deeplink: {
                direction: 'buy',
                providerId: pluginId,
                handler: async link => {
                  if (link.direction !== 'buy') return

                  const orderId = link.query.orderId ?? 'unknown'
                  const status = link.query.status?.replace('?', '')

                  switch (status) {
                    case 'success': {
                      onLogEvent('Buy_Success', {
                        conversionValues: {
                          conversionType: 'buy',
                          sourceFiatCurrencyCode: simplexFiatCode,
                          sourceFiatAmount:
                            goodQuote.fiat_money.amount.toString(),
                          destAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            tokenId: request.tokenId,
                            exchangeAmount:
                              goodQuote.digital_money.amount.toString()
                          }),
                          fiatProviderId: pluginId,
                          orderId
                        }
                      })
                      navigation.pop()
                      break
                    }
                    case 'failure': {
                      showToast(
                        lstrings.fiat_plugin_buy_failed_try_again,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                      navigation.pop()
                      break
                    }
                    default: {
                      showToast(
                        lstrings.fiat_plugin_buy_unknown_status,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                      navigation.pop()
                    }
                  }
                }
              }
            })
          },
          closeQuote: async (): Promise<void> => {}
        })
      }

      return quotes
    }
  }

  return plugin
}
