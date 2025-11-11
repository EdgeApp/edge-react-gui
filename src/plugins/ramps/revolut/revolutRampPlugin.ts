import { asMaybe } from 'cleaners'
import type { EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { findTokenIdByNetworkLocation } from '../../../util/CurrencyInfoHelpers'
import { makeUuid } from '../../../util/rnUtils'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import { ProviderSupportStore } from '../../gui/providers/ProviderSupportStore'
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
// Only 'revolut' is supported for this plugin
const paymentType = 'revolut'

interface ProviderConfigCache {
  data: RevolutConfig | null
  timestamp: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export const revolutRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
) => {
  // Validate and extract API configuration
  const initOptions = asInitOptions(config.initOptions)
  const { apiKey, apiUrl } = initOptions
  const { account, onLogEvent } = config

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

      // Global constraints pre-check
      const constraintOk = validateRampCheckSupportRequest(pluginId, request, [
        paymentType
      ])
      if (!constraintOk) return { supported: false }

      // Check direction support
      if (!validateDirection(direction)) {
        return { supported: false }
      }

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
        payment: paymentType
      })

      // Check asset support
      const assetsSupported = validateAssets({
        currencyPluginId: cryptoAsset.pluginId,
        tokenId: cryptoAsset.tokenId,
        fiatCurrencyCode: ensureIsoPrefix(fiatAsset.currencyCode),
        assetMap
      })

      return {
        supported: assetsSupported,
        supportedAmountTypes: assetsSupported ? ['fiat'] : undefined
      }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const {
        fiatCurrencyCode,
        regionCode,
        tokenId,
        displayCurrencyCode,
        direction
      } = request
      const currencyPluginId = request.wallet.currencyInfo.pluginId

      const isMaxAmount = 'max' in request.amountQuery
      const exchangeAmount =
        'amount' in request.amountQuery ? request.amountQuery.amount : ''
      const maxAmountLimit =
        'max' in request.amountQuery &&
        typeof request.amountQuery.max === 'string'
          ? request.amountQuery.max
          : undefined

      // Constraints per request
      const constraintOk = validateRampQuoteRequest(
        pluginId,
        request,
        paymentType
      )
      if (!constraintOk) return []

      // Check direction support
      if (!validateDirection(direction)) {
        return []
      }

      // Amount type check is now handled in checkSupport phase

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
        payment: paymentType
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
        amount = revolutFiat.max_limit.toString()
      } else {
        amount = exchangeAmount
        // Check if amount is within limits
        const amountNum = parseFloat(amount)
        if (amountNum < revolutFiat.min_limit) {
          throw new FiatProviderError({
            providerId: pluginId,
            errorType: 'underLimit',
            errorAmount: revolutFiat.min_limit,
            displayCurrencyCode: revolutFiat.currency
          })
        }
        if (amountNum > revolutFiat.max_limit) {
          throw new FiatProviderError({
            providerId: pluginId,
            errorType: 'overLimit',
            errorAmount: revolutFiat.max_limit,
            displayCurrencyCode: revolutFiat.currency
          })
        }
      }

      // Fetch quote from Revolut (API only needs country code)
      let quoteData = await fetchRevolutQuote(
        {
          fiat: revolutFiat.currency,
          amount,
          crypto: revolutCrypto.id,
          payment: paymentType,
          region: regionCode.countryCode
        },
        { apiKey, baseUrl: apiUrl }
      )

      if (isMaxAmount && maxAmountLimit != null) {
        const capValue = parseFloat(maxAmountLimit)
        const quotedCrypto = parseFloat(quoteData.crypto.amount.toString())
        const currentFiat = parseFloat(amount)
        if (
          !Number.isNaN(capValue) &&
          !Number.isNaN(quotedCrypto) &&
          !Number.isNaN(currentFiat) &&
          quotedCrypto > 0 &&
          capValue < quotedCrypto
        ) {
          const scaledFiat = (currentFiat * capValue) / quotedCrypto
          if (scaledFiat < revolutFiat.min_limit) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'underLimit',
              errorAmount: revolutFiat.min_limit,
              displayCurrencyCode: revolutFiat.currency
            })
          }
          amount = scaledFiat.toString()
          quoteData = await fetchRevolutQuote(
            {
              fiat: revolutFiat.currency,
              amount,
              crypto: revolutCrypto.id,
              payment: 'revolut',
              region: regionCode.countryCode
            },
            { apiKey, baseUrl: apiUrl }
          )
        }
      }

      const cryptoAmount = quoteData.crypto.amount.toString()
      const fiatAmount = amount

      // Assume 1 minute expiration
      const expirationDate = new Date(Date.now() + 1000 * 60)

      const quote: RampQuote = {
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
        paymentType,
        settlementRange: getSettlementRange(paymentType, direction),

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

          const orderId = await makeUuid()

          const { ramp_redirect_url: redirectUrl } =
            await fetchRevolutRedirectUrl(
              {
                fiat: revolutFiat.currency,
                amount: parseFloat(fiatAmount),
                crypto: quoteData.crypto.currencyId,
                payment: paymentType,
                region: regionCode.countryCode, // API only needs country code
                wallet: walletAddress,
                partnerRedirectUrl: successReturnURL,
                orderId
              },
              { apiKey, baseUrl: apiUrl }
            )

          await openExternalWebView({
            url: redirectUrl,
            deeplink: {
              direction: 'buy',
              providerId: pluginId,
              handler: async link => {
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
            }
          })
        },

        closeQuote: async () => {
          // Cleanup deeplink handler
          rampDeeplinkManager.unregister()
        }
      }

      return [quote]
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
