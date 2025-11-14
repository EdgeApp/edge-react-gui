import type { EdgeAccount } from 'edge-core-js'
import { base16 } from 'rfc4648'

import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getContractAddress } from '../../../util/CurrencyInfoHelpers'
import { removeIsoPrefix } from '../../../util/utils'
import type { EdgeVault } from '../../../util/vault/edgeVault'
import { makeEdgeVault } from '../../../util/vault/edgeVault'
import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import type {
  RampApproveQuoteParams,
  RampCheckSupportRequest,
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
import { handleExitErrorsGracefully } from '../utils/exitUtils'
import { makeInfiniteApi } from './infiniteApi'
import type {
  InfiniteCountriesResponse,
  InfiniteCurrenciesResponse,
  InfiniteQuoteFlow
} from './infiniteApiTypes'
import {
  EDGE_TO_INFINITE_NETWORK_MAP,
  normalizeCurrencies,
  type NormalizedCurrenciesMap
} from './infiniteConstants'
import { asInitOptions } from './infiniteRampTypes'
import { makeNavigationFlow } from './utils/navigationFlow'
import { authenticateWorkflow } from './workflows/authenticateWorkflow'
import { bankAccountWorkflow } from './workflows/bankAccountWorkflow'
import { confirmationWorkflow } from './workflows/confirmationWorkflow'
import { kycWorkflow } from './workflows/kycWorkflow'
import { tosWorkflow } from './workflows/tosWorkflow'

const pluginId = 'infinite'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/infinite.png`
const pluginDisplayName = 'Infinite'
// Extend as more become supported:
const DEFAULT_PAYMENT_TYPE: FiatPaymentType = 'wire'

// Storage keys
const INFINITE_PRIVATE_KEY = 'infinite_auth_private_key'
// DEV ONLY: This should never be committed as true in production.
const ENABLE_DEV_TESTING_CAPABILITIES = false

// Plugin state interface
export interface InfinitePluginState {
  privateKey?: Uint8Array
}

// Cache for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Helper functions
const getInfiniteNetwork = (edgePluginId: string): string | undefined => {
  return EDGE_TO_INFINITE_NETWORK_MAP[edgePluginId]
}

export const infiniteRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
): RampPlugin => {
  const { apiUrl, orgId } = asInitOptions(config.initOptions)
  const { account, navigation, onLogEvent } = config

  // Create API instance for this plugin
  const infiniteApi = makeInfiniteApi({ apiUrl, orgId })

  // Create vault instance for this plugin
  const vault: EdgeVault = makeEdgeVault({ disklet: account.disklet })

  // Plugin state
  const state: InfinitePluginState = {}

  const getPrivateKey = async (): Promise<Uint8Array> => {
    if (state.privateKey != null) {
      return state.privateKey
    }
    const key: string | undefined = await account.dataStore
      .getItem(pluginId, INFINITE_PRIVATE_KEY)
      .catch(() => undefined)

    const privateKey: Uint8Array =
      key != null ? hexToBytes(key) : infiniteApi.createPrivateKey()

    // Save new key to storage as hex string
    if (key == null) {
      await account.dataStore.setItem(
        pluginId,
        INFINITE_PRIVATE_KEY,
        bytesToHex(privateKey)
      )
    }
    state.privateKey = privateKey
    return privateKey
  }

  // DEV ONLY: Export for development clearing
  const _devOnlyClearAuthKey = async (
    account: EdgeAccount,
    pluginId: string
  ): Promise<void> => {
    await account.dataStore.deleteItem(pluginId, INFINITE_PRIVATE_KEY)
    state.privateKey = undefined
    infiniteApi.clearAuth()
  }

  // Cache for API responses
  let countriesCache: CacheEntry<InfiniteCountriesResponse> | null = null
  let currenciesCache: CacheEntry<{
    normalized: NormalizedCurrenciesMap
    raw: InfiniteCurrenciesResponse
  }> | null = null
  const CACHE_TTL = 120000 // 2 minutes

  // Helper function to get countries with cache
  const getCountriesWithCache =
    async (): Promise<InfiniteCountriesResponse> => {
      if (
        countriesCache != null &&
        Date.now() - countriesCache.timestamp < CACHE_TTL
      ) {
        return countriesCache.data
      }

      const data = await infiniteApi.getCountries()
      countriesCache = { data, timestamp: Date.now() }
      return data
    }

  // Helper function to get normalized currencies with cache
  const getNormalizedCurrenciesWithCache = async (): Promise<{
    normalized: NormalizedCurrenciesMap
    raw: InfiniteCurrenciesResponse
  }> => {
    if (
      currenciesCache != null &&
      Date.now() - currenciesCache.timestamp < CACHE_TTL
    ) {
      return currenciesCache.data
    }
    const raw = await infiniteApi.getCurrencies()
    const normalized = normalizeCurrencies(raw)
    currenciesCache = {
      data: { normalized, raw },
      timestamp: Date.now()
    }
    return { normalized, raw }
  }

  // Find a matching country by code or EU member state code
  const findCountry = (
    countries: InfiniteCountriesResponse,
    countryCode: string
  ): InfiniteCountriesResponse['countries'][number] | undefined => {
    const code = countryCode.toUpperCase()
    return (
      countries.countries.find(c => c.code === code && c.isAllowed) ??
      countries.countries.find(
        c =>
          Array.isArray(c.memberStates) &&
          c.isAllowed &&
          c.memberStates.includes(code)
      )
    )
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo: {
      partnerIcon,
      pluginDisplayName
    },

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      try {
        const { direction, regionCode, fiatAsset, cryptoAsset } = request

        // We don't support sell yet
        if (direction === 'sell') {
          return { supported: false }
        }

        // Global constraints pre-check
        const paymentTypes: FiatPaymentType[] = [DEFAULT_PAYMENT_TYPE]
        const constraintOk = validateRampCheckSupportRequest(
          pluginId,
          request,
          paymentTypes
        )
        if (!constraintOk) return { supported: false }

        // Check crypto network support first
        const infiniteNetwork = getInfiniteNetwork(cryptoAsset.pluginId)
        if (infiniteNetwork == null) {
          return { supported: false }
        }

        // Get countries and currencies from API
        const [countries, currenciesData] = await Promise.all([
          getCountriesWithCache(),
          getNormalizedCurrenciesWithCache()
        ])
        const normalizedCurrencies = currenciesData.normalized

        // Check region support dynamically (supports EU aggregate via memberStates)
        const country = findCountry(countries, regionCode.countryCode)
        if (country == null) {
          return { supported: false }
        }

        // Check fiat support based on country
        const cleanFiatCode = removeIsoPrefix(
          fiatAsset.currencyCode
        ).toUpperCase()
        if (!country.supportedFiatCurrencies.includes(cleanFiatCode)) {
          return { supported: false }
        }

        // Check payment method support for direction
        const paymentMethods =
          direction === 'buy'
            ? country.supportedPaymentMethods.onRamp
            : country.supportedPaymentMethods.offRamp

        if (paymentMethods.length === 0) {
          return { supported: false }
        }

        // Get the currency config for this pluginId
        const currencyConfig = account.currencyConfig[cryptoAsset.pluginId]
        if (currencyConfig == null) {
          return { supported: false }
        }

        // Get the contract address for the crypto asset
        const contractAddress = getContractAddress(
          currencyConfig,
          cryptoAsset.tokenId
        )
        const lookupKey = contractAddress?.toLowerCase() ?? 'native'

        // Look up the crypto currency in our normalized map
        const pluginCurrencies = normalizedCurrencies[cryptoAsset.pluginId]
        if (pluginCurrencies == null) {
          return { supported: false }
        }

        const cryptoCurrencyData = pluginCurrencies[lookupKey]
        if (cryptoCurrencyData == null) {
          return { supported: false }
        }

        // Check if on/off-ramp is supported for this crypto
        const directionSupported =
          direction === 'buy' && cryptoCurrencyData.supportsOnRamp
        // TODO: Uncomment this when we support sell
        //  || (direction === 'sell' && cryptoCurrencyData.supportsOffRamp)

        if (!directionSupported) {
          return { supported: false }
        }

        // Check if the country is supported for this crypto's on/off-ramp
        const supportedCountries =
          direction === 'buy'
            ? cryptoCurrencyData.onRampCountries
            : cryptoCurrencyData.offRampCountries

        if (
          supportedCountries != null &&
          !supportedCountries.includes(country.code)
        ) {
          return { supported: false }
        }

        return {
          supported: true,
          supportedAmountTypes: ['fiat', 'crypto']
        }
      } catch (error) {
        console.error('Infinite: Error in checkSupport:', error)
        return { supported: false }
      }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      // Global constraints pre-check for quote requests
      const quoteConstraintOk = validateRampQuoteRequest(
        pluginId,
        request,
        DEFAULT_PAYMENT_TYPE
      )
      if (!quoteConstraintOk) return []

      const currencyPluginId = request.wallet.currencyInfo.pluginId

      // Extract max amount flags
      const isMaxAmount =
        'max' in request.amountQuery ||
        'maxExchangeAmount' in request.amountQuery
      const maxAmountLimit =
        'maxExchangeAmount' in request.amountQuery
          ? request.amountQuery.maxExchangeAmount
          : undefined

      // Get the Infinite network name
      const infiniteNetwork = getInfiniteNetwork(currencyPluginId)
      if (infiniteNetwork == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      // Get countries and currencies from API
      const [countries, currenciesData] = await Promise.all([
        getCountriesWithCache(),
        getNormalizedCurrenciesWithCache()
      ])
      const normalizedCurrencies = currenciesData.normalized
      const currencies = currenciesData.raw

      // Verify country and fiat currency support (supports EU aggregate via memberStates)
      const country = findCountry(countries, request.regionCode.countryCode)

      const cleanFiatCode = removeIsoPrefix(
        request.fiatCurrencyCode
      ).toUpperCase()

      if (country == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted',
          displayCurrencyCode: request.displayCurrencyCode
        })
      }

      if (!country.supportedFiatCurrencies.includes(cleanFiatCode)) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'fiatUnsupported',
          fiatCurrencyCode: cleanFiatCode,
          paymentMethod: 'bank',
          pluginDisplayName
        })
      }

      // Check if payment methods are available for the direction
      const paymentMethods =
        request.direction === 'buy'
          ? country.supportedPaymentMethods.onRamp
          : country.supportedPaymentMethods.offRamp

      if (paymentMethods.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'paymentUnsupported'
        })
      }

      // Get the currency config for this pluginId
      const currencyConfig = account.currencyConfig[currencyPluginId]
      if (currencyConfig == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      // Get the contract address for the crypto asset
      const contractAddress = getContractAddress(
        currencyConfig,
        request.tokenId
      )
      const lookupKey = contractAddress?.toLowerCase() ?? 'native'

      // Look up the crypto currency in our normalized map
      const pluginCurrencies = normalizedCurrencies[currencyPluginId]
      if (pluginCurrencies == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const targetCurrency = pluginCurrencies[lookupKey]
      if (targetCurrency == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      // Verify crypto currency supports the direction and country
      const directionSupported =
        (request.direction === 'buy' && targetCurrency.supportsOnRamp) ||
        (request.direction === 'sell' && targetCurrency.supportsOffRamp)

      if (!directionSupported) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const supportedCountries =
        request.direction === 'buy'
          ? targetCurrency.onRampCountries
          : targetCurrency.offRampCountries

      if (
        supportedCountries != null &&
        !supportedCountries.includes(country.code)
      ) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted',
          displayCurrencyCode: request.displayCurrencyCode
        })
      }

      const amountType = request.amountType
      const isFiatAmountType = amountType === 'fiat'
      const isCryptoAmountType = !isFiatAmountType

      // Get fiat currency for limit checking and max amount determination
      const fiatCurrency = currencies.currencies.find(
        c => c.code === cleanFiatCode && c.type === 'fiat'
      )

      if (fiatCurrency == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'fiatUnsupported',
          fiatCurrencyCode: cleanFiatCode,
          paymentMethod: 'bank',
          pluginDisplayName
        })
      }

      const parseAmountString = (value?: string): number | undefined => {
        if (value == null) return undefined
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : undefined
      }

      const maxAmountLimitValue = parseAmountString(maxAmountLimit)
      const minFiatAmount = parseAmountString(fiatCurrency.minAmount)
      const maxFiatAmount = parseAmountString(fiatCurrency.maxAmount)
      const minCryptoAmount = parseAmountString(targetCurrency.minAmount)
      const maxCryptoAmount = parseAmountString(targetCurrency.maxAmount)

      let fiatAmount: number | undefined
      let cryptoAmount: number | undefined

      const amountString =
        'exchangeAmount' in request.amountQuery
          ? request.amountQuery.exchangeAmount
          : undefined

      const assertNumber = (value: number | undefined): value is number =>
        value != null && Number.isFinite(value)

      if (isMaxAmount) {
        if (isFiatAmountType) {
          if (!assertNumber(maxFiatAmount)) return []
          if (assertNumber(maxAmountLimitValue)) {
            fiatAmount = Math.min(maxFiatAmount, maxAmountLimitValue)

            if (assertNumber(minFiatAmount) && fiatAmount < minFiatAmount) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'underLimit',
                errorAmount: minFiatAmount,
                displayCurrencyCode: request.fiatCurrencyCode
              })
            }
          } else {
            fiatAmount = maxFiatAmount
          }
        } else {
          if (!assertNumber(maxCryptoAmount)) return []
          let amountToUse = maxCryptoAmount
          if (assertNumber(maxAmountLimitValue)) {
            amountToUse = Math.min(amountToUse, maxAmountLimitValue)
          }
          cryptoAmount = amountToUse

          if (assertNumber(minCryptoAmount) && cryptoAmount < minCryptoAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'underLimit',
              errorAmount: minCryptoAmount,
              displayCurrencyCode: request.displayCurrencyCode
            })
          }
        }
      } else {
        if (amountString == null) {
          return []
        }
        const parsedAmount = parseFloat(amountString)
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          return []
        }

        if (isFiatAmountType) {
          fiatAmount = parsedAmount

          if (assertNumber(minFiatAmount) && fiatAmount < minFiatAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'underLimit',
              errorAmount: minFiatAmount,
              displayCurrencyCode: request.fiatCurrencyCode
            })
          }

          if (assertNumber(maxFiatAmount) && fiatAmount > maxFiatAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'overLimit',
              errorAmount: maxFiatAmount,
              displayCurrencyCode: request.fiatCurrencyCode
            })
          }
        } else {
          cryptoAmount = parsedAmount

          if (assertNumber(minCryptoAmount) && cryptoAmount < minCryptoAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'underLimit',
              errorAmount: minCryptoAmount,
              displayCurrencyCode: request.displayCurrencyCode
            })
          }

          if (assertNumber(maxCryptoAmount) && cryptoAmount > maxCryptoAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'overLimit',
              errorAmount: maxCryptoAmount,
              displayCurrencyCode: request.displayCurrencyCode
            })
          }
        }
      }

      if (isFiatAmountType && fiatAmount == null) return []
      if (isCryptoAmountType && cryptoAmount == null) return []

      // Fetch quote from API
      const flow: InfiniteQuoteFlow =
        request.direction === 'buy' ? 'ONRAMP' : 'OFFRAMP'

      const sourceParams =
        request.direction === 'buy'
          ? isFiatAmountType
            ? { asset: cleanFiatCode, amount: fiatAmount! }
            : { asset: cleanFiatCode }
          : isCryptoAmountType
          ? {
              asset: targetCurrency.currencyCode,
              network: infiniteNetwork,
              amount: cryptoAmount!
            }
          : {
              asset: targetCurrency.currencyCode,
              network: infiniteNetwork
            }

      const targetParams =
        request.direction === 'buy'
          ? {
              asset: targetCurrency.currencyCode,
              network: infiniteNetwork,
              ...(isCryptoAmountType ? { amount: cryptoAmount! } : {})
            }
          : isFiatAmountType
          ? { asset: cleanFiatCode, amount: fiatAmount! }
          : { asset: cleanFiatCode }

      const quoteParams = {
        flow,
        source: sourceParams,
        target: targetParams
      }

      const quoteResponse = await infiniteApi.createQuote(quoteParams)

      const responseCryptoAmount =
        request.direction === 'buy'
          ? quoteResponse.target.amount
          : quoteResponse.source.amount
      const responseFiatAmount =
        request.direction === 'buy'
          ? quoteResponse.source.amount
          : quoteResponse.target.amount

      // Convert to RampQuoteResult - map based on direction
      const quote: RampQuote = {
        pluginId,
        partnerIcon,
        pluginDisplayName,
        displayCurrencyCode: request.displayCurrencyCode,
        cryptoAmount: (responseCryptoAmount ?? 0).toString(),
        isEstimate: false,
        fiatCurrencyCode: request.fiatCurrencyCode,
        fiatAmount: (responseFiatAmount ?? 0).toString(),
        direction: request.direction,
        regionCode: request.regionCode,
        paymentType: 'wire', // Infinite uses wire bank transfers
        expirationDate:
          quoteResponse.expiresAt != null
            ? new Date(quoteResponse.expiresAt)
            : new Date(Date.now() + 5 * 60 * 1000), // Default 5 minutes if not provided
        settlementRange: {
          min: { value: 1, unit: 'days' },
          max: { value: 3, unit: 'days' }
        },
        approveQuote: async (
          approveParams: RampApproveQuoteParams
        ): Promise<void> => {
          await handleExitErrorsGracefully(async () => {
            const { coreWallet } = approveParams

            // Navigation flow utility shared across workflows to coordinate
            const navigationFlow = makeNavigationFlow(navigation)

            // DEV ONLY: Clear auth key if amount is exactly 404
            if (
              ENABLE_DEV_TESTING_CAPABILITIES &&
              `exchangeAmount` in request.amountQuery &&
              request.amountQuery.exchangeAmount === '404'
            ) {
              await _devOnlyClearAuthKey(account, pluginId)
            }

            // Authenticate with Infinite
            await authenticateWorkflow({
              infiniteApi,
              privateKey: await getPrivateKey()
            })

            // User needs to complete KYC
            await kycWorkflow({
              infiniteApi,
              navigationFlow,
              pluginId,
              vault
            })

            // User needs to accept TOS
            await tosWorkflow({
              infiniteApi,
              navigationFlow
            })

            // Ensure we have a bank account
            const bankAccountResult = await bankAccountWorkflow({
              infiniteApi,
              navigationFlow,
              vault
            })

            // Get fresh quote before confirmation using existing params
            const freshQuote = await infiniteApi.createQuote(quoteParams)

            // Show confirmation screen
            const result = await confirmationWorkflow(
              {
                infiniteApi,
                navigationFlow
              },
              {
                source: {
                  amount:
                    request.direction === 'buy'
                      ? freshQuote.source.amount.toString()
                      : freshQuote.target.amount.toString(),
                  currencyCode: cleanFiatCode
                },
                target: {
                  amount:
                    request.direction === 'buy'
                      ? freshQuote.target.amount.toString()
                      : freshQuote.source.amount.toString(),
                  currencyCode: request.displayCurrencyCode
                },
                request,
                freshQuote,
                coreWallet,
                bankAccountId: bankAccountResult.bankAccountId,
                flow,
                infiniteNetwork,
                cleanFiatCode
              }
            )

            if (!result.confirmed || result.transfer == null) {
              return
            }

            // Log the success event based on direction
            if (request.direction === 'buy') {
              onLogEvent('Buy_Success', {
                conversionValues: {
                  conversionType: 'buy',
                  sourceFiatCurrencyCode: request.fiatCurrencyCode,
                  sourceFiatAmount: freshQuote.source.amount.toString(),
                  destAmount: new CryptoAmount({
                    currencyConfig: coreWallet.currencyConfig,
                    currencyCode: request.displayCurrencyCode,
                    exchangeAmount: freshQuote.target.amount.toString()
                  }),
                  fiatProviderId: pluginId,
                  orderId: result.transfer.id
                }
              })
            } else {
              onLogEvent('Sell_Success', {
                conversionValues: {
                  conversionType: 'sell',
                  destFiatCurrencyCode: request.fiatCurrencyCode,
                  destFiatAmount: freshQuote.target.amount.toString(),
                  sourceAmount: new CryptoAmount({
                    currencyConfig: coreWallet.currencyConfig,
                    currencyCode: request.displayCurrencyCode,
                    exchangeAmount: freshQuote.source.amount.toString()
                  }),
                  fiatProviderId: pluginId,
                  orderId: result.transfer.id
                }
              })
            }
          })
        },
        closeQuote: async (): Promise<void> => {}
      }

      return [quote]
    }
  }

  return plugin
}

// Utility functions
const hexToBytes = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  return base16.parse(hex)
}

const bytesToHex = (bytes: Uint8Array): string => {
  return base16.stringify(bytes)
}
