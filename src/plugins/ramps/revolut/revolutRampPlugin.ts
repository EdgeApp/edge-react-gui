import { asMaybe } from 'cleaners'
import type { EdgeTokenId } from 'edge-core-js'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { findTokenIdByNetworkLocation } from '../../../util/CurrencyInfoHelpers'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import { ProviderSupportStore } from '../../gui/providers/ProviderSupportStore'
import { rampDeeplinkManager, type RampLink } from '../rampDeeplinkHandler'
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
import { asInitOptions } from './revolutRampTypes'
import {
  asRevolutCrypto,
  asRevolutFiat,
  fetchRevolutConfig,
  fetchRevolutQuote,
  fetchRevolutRedirectUrl,
  type RevolutConfig,
  type RevolutCrypto,
  type RevolutFiat
} from './util/fetchRevolut'

const pluginId = 'revolut'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/revolut.png`
const pluginDisplayName = 'Revolut'

interface ProviderConfigCache {
  data: RevolutConfig | null
  timestamp: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Cache for max amounts with 2 minute TTL
const maxAmountCache = new Map<string, { amount: string; timestamp: number }>()
const MAX_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

const getCacheKey = (fiatCode: string, cryptoCode: string): string => {
  return `buy-${fiatCode}-${cryptoCode}-fiat` // Revolut only supports buy with fiat amount
}

export const revolutRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
) => {
  // Validate and extract API configuration
  const initOptions = asInitOptions(config.initOptions)
  const { apiKey, apiUrl } = initOptions
  const { account, onLogEvent, makeUuid } = config

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  // Utility function to ensure fiat currency codes have 'iso:' prefix
  const ensureIsoPrefix = (currencyCode: string): string => {
    return currencyCode.startsWith('iso:')
      ? currencyCode
      : `iso:${currencyCode}`
  }

  // Cache for provider configuration
  let configCache: ProviderConfigCache = {
    data: null,
    timestamp: 0
  }

  // ProviderSupportStore to manage supported assets
  let supportedAssets: ProviderSupportStore | null = null

  async function fetchProviderConfig(): Promise<RevolutConfig> {
    const now = Date.now()

    // Check if cache is valid
    if (
      configCache.data != null &&
      now - configCache.timestamp < CACHE_TTL_MS
    ) {
      return configCache.data
    }

    // Fetch fresh configuration with API configuration
    const config = await fetchRevolutConfig({ apiKey, baseUrl: apiUrl })

    // Update cache
    configCache = {
      data: config,
      timestamp: now
    }

    // Reset supported assets to force reprocessing
    supportedAssets = null

    return config
  }

  function processSupportedAssets(
    config: RevolutConfig,
    account: RampPluginConfig['account']
  ): ProviderSupportStore {
    if (supportedAssets != null) return supportedAssets

    supportedAssets = new ProviderSupportStore(pluginId)
    supportedAssets.add.direction('buy')

    // Process the configuration using the helper functions at the bottom
    processRevolutConfig(config, account, supportedAssets)

    return supportedAssets
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const { direction, regionCode, fiatAsset, cryptoAsset } = request

      // Check direction support
      if (!validateDirection(direction)) {
        return { supported: false }
      }

      try {
        // Fetch provider configuration
        const config = await fetchProviderConfig()

        // Create region string with state if available
        const region =
          regionCode.stateProvinceCode == null
            ? regionCode.countryCode
            : `${regionCode.countryCode}:${regionCode.stateProvinceCode}`

        // Check region support
        if (!validateRegion(region, config.countries)) {
          return { supported: false }
        }

        // Process supported assets
        const store = processSupportedAssets(config, account)

        // Get asset map for validation
        const assetMap = store.getFiatProviderAssetMap({
          direction: 'buy',
          region,
          payment: 'revolut'
        })

        // Check asset support
        const assetsSupported = validateAssets({
          currencyPluginId: cryptoAsset.pluginId,
          tokenId: cryptoAsset.tokenId,
          fiatCurrencyCode: ensureIsoPrefix(fiatAsset.currencyCode),
          assetMap
        })

        return { supported: assetsSupported }
      } catch (error) {
        console.error('Failed to check Revolut support:', error)
        return { supported: false }
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      const {
        exchangeAmount,
        fiatCurrencyCode,
        regionCode,
        pluginId: currencyPluginId,
        tokenId,
        displayCurrencyCode,
        direction
      } = request

      const isMaxAmount =
        typeof exchangeAmount === 'object' && exchangeAmount.max
      const exchangeAmountString = isMaxAmount ? '' : (exchangeAmount as string)

      // Check direction support
      if (!validateDirection(direction)) {
        return []
      }

      // Only support fiat amount type (Revolut requires fiat-based quotes)
      if (request.amountType !== 'fiat') {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'amountTypeUnsupported'
        })
      }

      try {
        // Fetch provider configuration (will use cache if valid)
        const config = await fetchProviderConfig()

        // Create region string with state if available
        const region =
          regionCode.stateProvinceCode == null
            ? regionCode.countryCode
            : `${regionCode.countryCode}:${regionCode.stateProvinceCode}`

        // Check region support
        if (!validateRegion(region, config.countries)) {
          return []
        }

        // Process supported assets
        const store = processSupportedAssets(config, account)

        // Get asset map for validation
        const assetMap = store.getFiatProviderAssetMap({
          direction: 'buy',
          region,
          payment: 'revolut'
        })

        // Check asset support
        if (
          !validateAssets({
            currencyPluginId,
            tokenId,
            fiatCurrencyCode: ensureIsoPrefix(fiatCurrencyCode),
            assetMap
          })
        ) {
          return []
        }

        // Get crypto and fiat info from the store
        const cryptoKey = `${currencyPluginId}:${tokenId}`
        const revolutCrypto = asMaybe(asRevolutCrypto)(
          store.getCryptoInfo(cryptoKey)
        )
        const revolutFiat = asMaybe(asRevolutFiat)(
          store.getFiatInfo(ensureIsoPrefix(fiatCurrencyCode))
        )

        if (revolutCrypto == null || revolutFiat == null) {
          return []
        }

        // Handle max amount
        let amount: string
        if (isMaxAmount) {
          const cacheKey = getCacheKey(revolutFiat.currency, revolutCrypto.id)
          const cached = maxAmountCache.get(cacheKey)
          const now = Date.now()

          if (cached != null && now - cached.timestamp < MAX_CACHE_TTL) {
            amount = cached.amount
          } else {
            amount = revolutFiat.max_limit.toString()
            // Cache the result
            maxAmountCache.set(cacheKey, {
              amount,
              timestamp: now
            })
          }
        } else {
          amount = exchangeAmountString
          // Check if amount is within limits
          const amountNum = parseFloat(amount)
          if (
            amountNum < revolutFiat.min_limit ||
            amountNum > revolutFiat.max_limit
          ) {
            // Return empty array for amounts outside supported range
            return []
          }
        }

        // Fetch quote from Revolut (API only needs country code)
        const quoteData = await fetchRevolutQuote(
          {
            fiat: revolutFiat.currency,
            amount,
            crypto: revolutCrypto.id,
            payment: 'revolut', // Only revolut is supported at the moment
            region: regionCode.countryCode
          },
          { apiKey, baseUrl: apiUrl }
        )

        const cryptoAmount = quoteData.crypto.amount.toString()
        const fiatAmount = amount

        // Assume 1 minute expiration
        const expirationDate = new Date(Date.now() + 1000 * 60)

        const quote: RampQuoteResult = {
          pluginId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode,
          cryptoAmount,
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount,
          direction,
          expirationDate,
          regionCode,
          paymentType: 'revolut',
          settlementRange: {
            min: { value: 5, unit: 'minutes' },
            max: { value: 1, unit: 'hours' }
          },

          approveQuote: async (
            approveParams: RampApproveQuoteParams
          ): Promise<void> => {
            const { coreWallet } = approveParams
            const walletAddresses = await coreWallet.getAddresses({
              tokenId
            })
            const walletAddress = walletAddresses[0]?.publicAddress

            if (walletAddress == null) {
              throw new Error('No wallet address found')
            }

            const successReturnURL = encodeURIComponent(
              'https://return.edge.app/fiatprovider/buy/revolut?transactionStatus=success'
            )

            const orderId =
              makeUuid != null ? await makeUuid() : `revolut-${Date.now()}`

            const { ramp_redirect_url: redirectUrl } =
              await fetchRevolutRedirectUrl(
                {
                  fiat: revolutFiat.currency,
                  amount: parseFloat(fiatAmount),
                  crypto: quoteData.crypto.currencyId,
                  payment: 'revolut',
                  region: regionCode.countryCode, // API only needs country code
                  wallet: walletAddress,
                  partnerRedirectUrl: successReturnURL,
                  orderId
                },
                { apiKey, baseUrl: apiUrl }
              )

            // Register deeplink handler
            rampDeeplinkManager.register(
              direction,
              pluginId,
              async (link: RampLink): Promise<void> => {
                if (link.direction === 'sell') {
                  throw new FiatProviderError({
                    providerId: pluginId,
                    errorType: 'paymentUnsupported'
                  })
                }
                const { transactionStatus } = link.query
                if (transactionStatus === 'success') {
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
                      orderId
                    }
                  })
                  const message =
                    sprintf(
                      lstrings.fiat_plugin_buy_complete_message_s,
                      cryptoAmount,
                      displayCurrencyCode,
                      fiatAmount,
                      fiatCurrencyCode,
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
                      ok: { label: lstrings.string_ok }
                    },
                    title: lstrings.fiat_plugin_buy_complete_title,
                    message
                  })
                } else {
                  throw new Error(
                    `Unexpected return link status: ${transactionStatus}`
                  )
                }
              }
            )

            try {
              // Open external webview
              if (Platform.OS === 'ios') {
                await SafariView.show({ url: redirectUrl })
              } else {
                await CustomTabs.openURL(redirectUrl)
              }
            } catch (error) {
              // Cleanup deeplink handler on error
              rampDeeplinkManager.unregister()
              throw error
            }
          },

          closeQuote: async () => {
            // Cleanup deeplink handler
            rampDeeplinkManager.unregister()
          }
        }

        return [quote]
      } catch (error) {
        // Only throw for actual API/network failures
        console.error('Failed to fetch Revolut quote:', error)

        // Check if it's a known unsupported case
        if (error instanceof FiatProviderError) {
          return []
        }

        // Re-throw actual errors
        throw error
      }
    }
  }

  return plugin
}

// -----------------------------------------------------------------------------
// Helper Functions (moved from revolutProvider.ts)
// -----------------------------------------------------------------------------

function addRevolutCrypto(
  supportedAssets: ProviderSupportStore,
  account: RampPluginConfig['account'],
  crypto: RevolutCrypto
): void {
  let pluginId: string | undefined
  let tokenId: EdgeTokenId | undefined

  switch (crypto.blockchain) {
    case 'ALGORAND':
    case 'AVALANCHE':
    case 'BITCOIN':
    case 'BITCOINCASH':
    case 'CARDANO':
    case 'DOGECOIN':
    case 'ETHEREUM':
    case 'LITECOIN':
    case 'OPTIMISM':
    case 'POLKADOT':
    case 'POLYGON':
    case 'RIPPLE':
    case 'SOLANA':
    case 'STELLAR':
    case 'TEZOS':
    case 'TRON':
      pluginId = crypto.blockchain.toLowerCase()
      break
    default:
      console.warn(`Unknown blockchain from Revolut: ${crypto.blockchain}`)
      return
  }

  if (crypto.smartContractAddress != null) {
    tokenId = findTokenIdByNetworkLocation({
      account,
      pluginId,
      networkLocation: { contractAddress: crypto.smartContractAddress }
    })
  } else {
    switch (crypto.currency) {
      case 'ADA':
      case 'ALGO':
      case 'AVAX':
      case 'BCH':
      case 'BTC':
      case 'DOGE':
      case 'DOT':
      case 'ETH':
      case 'LTC':
      case 'POL':
      case 'SOL':
      case 'XLM':
      case 'XRP':
      case 'XTZ':
        tokenId = null
        break
      default:
        // Skip unknown currencies
        return
    }
  }

  if (tokenId === undefined) {
    console.warn(`Unknown crypto currency from Revolut: ${crypto.currency}`)
    return
  }

  const cryptoKey = `${pluginId}:${tokenId}`
  supportedAssets.add
    .direction('*')
    .region('*')
    .fiat('*')
    .payment('*')
    .crypto(cryptoKey)
  supportedAssets.addCryptoInfo(cryptoKey, crypto)
}

function addRevolutPaymentMethod(
  supportedAssets: ProviderSupportStore,
  method: string
): void {
  switch (method) {
    case 'revolut':
      supportedAssets.add
        .direction('*')
        .region('*')
        .fiat('*')
        .payment('revolut')
      return
    case 'card':
    case 'apple-pay':
    case 'google-pay':
      // Intentionally not supported
      return
    default:
      console.warn(`Unknown payment method from Revolut: ${method}`)
  }
}

function addRevolutFiat(
  supportedAssets: ProviderSupportStore,
  fiat: RevolutFiat
): void {
  const fiatKey = `iso:${fiat.currency}`
  supportedAssets.add.direction('*').region('*').fiat(fiatKey).payment('*')
  supportedAssets.addFiatInfo(fiatKey, fiat)
}

function processRevolutConfig(
  configData: RevolutConfig,
  account: RampPluginConfig['account'],
  supportedAssets: ProviderSupportStore
): void {
  configData.countries.forEach(country => {
    supportedAssets.add.direction('*').region(country).fiat('*').payment('*')
  })
  configData.fiat.forEach(fiat => {
    addRevolutFiat(supportedAssets, fiat)
  })
  configData.crypto.forEach(crypto => {
    addRevolutCrypto(supportedAssets, account, crypto)
  })
  configData.payment_methods.forEach(method => {
    addRevolutPaymentMethod(supportedAssets, method)
  })
}

// -----------------------------------------------------------------------------
// Validation Helper Functions
// -----------------------------------------------------------------------------

/**
 * Validates if the direction is supported by Revolut
 * @param direction - The ramp direction ('buy' or 'sell')
 * @returns true if direction is 'buy', false otherwise
 */
function validateDirection(direction: 'buy' | 'sell'): boolean {
  return direction === 'buy'
}

/**
 * Validates if the region is supported by Revolut
 * @param regionCode - The ISO country code
 * @param supportedCountries - Array of supported country codes from Revolut config
 * @returns true if the country is supported, false otherwise
 */
function validateRegion(
  regionCode: string,
  supportedCountries: string[]
): boolean {
  // Extract country code from region string (handles both "US" and "US:CA" formats)
  const countryCode = regionCode.includes(':')
    ? regionCode.split(':')[0]
    : regionCode
  return supportedCountries.includes(countryCode)
}

/**
 * Validates if the crypto/fiat pair is supported by Revolut
 * @param params - Validation parameters
 * @returns true if both crypto and fiat assets are supported, false otherwise
 */
function validateAssets(params: {
  currencyPluginId: string
  tokenId: EdgeTokenId
  fiatCurrencyCode: string
  assetMap: ReturnType<ProviderSupportStore['getFiatProviderAssetMap']>
}): boolean {
  const { currencyPluginId, tokenId, fiatCurrencyCode, assetMap } = params

  // Check if crypto is supported
  const cryptoSupported = assetMap.crypto[currencyPluginId]?.some(
    token => token.tokenId === tokenId
  )

  // Check if fiat is supported
  const fiatSupported = assetMap.fiat[fiatCurrencyCode] != null

  return cryptoSupported && fiatSupported
}
