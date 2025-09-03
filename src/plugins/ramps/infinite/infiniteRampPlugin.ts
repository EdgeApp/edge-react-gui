import { showToast } from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { removeIsoPrefix } from '../../../util/utils'
import { openWebView } from '../../../util/webViewUtils'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import type {
  RampApproveQuoteParams,
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampPluginFactory,
  RampQuoteRequest,
  RampQuoteResult,
  RampSupportResult
} from '../rampPluginTypes'
import { withWorkflow } from '../utils/workflows'
import { makeInfiniteApi } from './infiniteApi'
import type {
  InfiniteCountriesResponse,
  InfiniteCurrenciesResponse,
  InfiniteQuoteFlow
} from './infiniteApiTypes'
import {
  asInitOptions,
  EDGE_TO_INFINITE_NETWORK_MAP,
  type FetchQuoteWorkflowState
} from './infiniteRampTypes'
import { authenticateWorkflow } from './workflows/authenticateWorkflow'
import { bankAccountWorkflow } from './workflows/bankAccountWorkflow'
import { confirmationWorkflow } from './workflows/confirmationWorkflow'
import { kycWorkflow } from './workflows/kycWorkflow'

const pluginId = 'infinite'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/infinite.png`
const pluginDisplayName = 'Infinite'

// Plugin state interface
export interface InfinitePluginState {
  privateKey?: Uint8Array
  customerId?: string
  bankAccountId?: string
  kycStatus?: 'pending' | 'approved' | 'rejected'
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

  // Plugin state
  const state: InfinitePluginState = {}

  // Cache for API responses
  let countriesCache: CacheEntry<InfiniteCountriesResponse> | null = null
  let currenciesCache: CacheEntry<InfiniteCurrenciesResponse> | null = null
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

  // Helper function to get currencies with cache
  const getCurrenciesWithCache =
    async (): Promise<InfiniteCurrenciesResponse> => {
      if (
        currenciesCache != null &&
        Date.now() - currenciesCache.timestamp < CACHE_TTL
      ) {
        return currenciesCache.data
      }

      const data = await infiniteApi.getCurrencies()
      currenciesCache = { data, timestamp: Date.now() }
      return data
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

        // Get countries and currencies from API
        const [countries, currencies] = await Promise.all([
          getCountriesWithCache(),
          getCurrenciesWithCache()
        ])

        // Check region support dynamically
        const country = countries.countries.find(
          c => c.code === regionCode.countryCode && c.isAllowed
        )
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

        // Check crypto network support
        const infiniteNetwork = getInfiniteNetwork(cryptoAsset.pluginId)
        if (infiniteNetwork == null) {
          return { supported: false }
        }

        // Get currency code from wallet
        const wallet =
          account.currencyWallets[Object.keys(account.currencyWallets)[0]]
        if (wallet == null) return { supported: false }

        let currencyCode = wallet.currencyInfo.currencyCode
        if (cryptoAsset.tokenId != null) {
          const allTokens =
            wallet.currencyConfig.allTokens[cryptoAsset.pluginId]
          if (!Array.isArray(allTokens)) return { supported: false }
          const token = allTokens.find(
            (t: any) => t.tokenId === cryptoAsset.tokenId
          )
          if (token == null) return { supported: false }
          currencyCode = token.currencyCode
        }

        // Check crypto asset support dynamically
        const cryptoCurrency = currencies.currencies.find(
          curr => curr.code === currencyCode && curr.type === 'crypto'
        )

        if (cryptoCurrency == null) {
          return { supported: false }
        }

        // Check if the network is supported for this crypto
        const networkSupported = cryptoCurrency.supportedNetworks?.some(
          net => net.network === infiniteNetwork
        )

        if (!networkSupported) {
          return { supported: false }
        }

        // Check if on/off-ramp is supported for this crypto
        const directionSupported =
          (direction === 'buy' && cryptoCurrency.supportsOnRamp) ||
          (direction === 'sell' && cryptoCurrency.supportsOffRamp)

        if (!directionSupported) {
          return { supported: false }
        }

        // Check if the country is supported for this crypto's on/off-ramp
        const supportedCountries =
          direction === 'buy'
            ? cryptoCurrency.onRampCountries
            : cryptoCurrency.offRampCountries

        if (
          supportedCountries != null &&
          !supportedCountries.includes(country.code)
        ) {
          return { supported: false }
        }

        return {
          supported: true,
          supportedAmountTypes: ['fiat']
        }
      } catch (error) {
        console.error('Infinite: Error in checkSupport:', error)
        return { supported: false }
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      const {
        direction,
        regionCode,
        exchangeAmount,
        amountType,
        pluginId: currencyPluginId,
        tokenId,
        displayCurrencyCode,
        fiatCurrencyCode
      } = request

      // Create workflow state scoped to this fetchQuote call
      const workflowState: FetchQuoteWorkflowState = {
        auth: { status: 'idle' },
        kyc: { status: 'idle' },
        bankAccount: { status: 'idle' }
      }

      // Only support fiat amounts for now
      if (amountType !== 'fiat') {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'amountTypeUnsupported'
        })
      }

      // Check if max amount requested
      if (typeof exchangeAmount === 'object' && exchangeAmount.max) {
        // TODO: Implement max amount logic when API supports it
        return []
      }

      const fiatAmount = parseFloat(exchangeAmount as string)
      if (isNaN(fiatAmount) || fiatAmount <= 0) {
        return []
      }

      // Get the Infinite network name
      const infiniteNetwork = getInfiniteNetwork(currencyPluginId)
      if (infiniteNetwork == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      // Get countries and currencies from API
      const [countries, currencies] = await Promise.all([
        getCountriesWithCache(),
        getCurrenciesWithCache()
      ])

      // Verify country and fiat currency support
      const country = countries.countries.find(
        c => c.code === regionCode.countryCode && c.isAllowed
      )

      const cleanFiatCode = removeIsoPrefix(fiatCurrencyCode).toUpperCase()

      if (country == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted',
          displayCurrencyCode
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
        direction === 'buy'
          ? country.supportedPaymentMethods.onRamp
          : country.supportedPaymentMethods.offRamp

      if (paymentMethods.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'paymentUnsupported'
        })
      }

      // Get crypto currency info
      const targetCurrency = currencies.currencies.find(
        c => c.code === displayCurrencyCode && c.type === 'crypto'
      )

      if (targetCurrency == null) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      // Verify crypto currency supports the direction and country
      const directionSupported =
        (direction === 'buy' && targetCurrency.supportsOnRamp) ||
        (direction === 'sell' && targetCurrency.supportsOffRamp)

      if (!directionSupported) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const supportedCountries =
        direction === 'buy'
          ? targetCurrency.onRampCountries
          : targetCurrency.offRampCountries

      if (
        supportedCountries != null &&
        !supportedCountries.includes(country.code)
      ) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted',
          displayCurrencyCode
        })
      }

      // Check amount limits based on direction and amount type
      if (direction === 'buy') {
        // For buy, we have fiat amount and need to check fiat limits
        const fiatCurrency = currencies.currencies.find(
          c => c.code === cleanFiatCode && c.type === 'fiat'
        )

        if (fiatCurrency != null) {
          const minFiatAmount = parseFloat(fiatCurrency.minAmount)
          const maxFiatAmount = parseFloat(fiatCurrency.maxAmount)

          if (fiatAmount < minFiatAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'underLimit',
              errorAmount: minFiatAmount,
              displayCurrencyCode: fiatCurrencyCode
            })
          }

          if (fiatAmount > maxFiatAmount) {
            throw new FiatProviderError({
              providerId: pluginId,
              errorType: 'overLimit',
              errorAmount: maxFiatAmount,
              displayCurrencyCode: fiatCurrencyCode
            })
          }
        }
      } else {
        // For sell, we need to check crypto limits
        // Since amountType is 'fiat', we don't have the crypto amount yet
        // We'll need to fetch a quote first to know the crypto amount
        // For now, skip the pre-check and let the API handle limit validation
        // The API will return an error if the resulting crypto amount is out of bounds
      }

      // Fetch quote from API
      const flow: InfiniteQuoteFlow = direction === 'buy' ? 'ONRAMP' : 'OFFRAMP'

      const quoteParams = {
        flow,
        source:
          direction === 'buy'
            ? { asset: cleanFiatCode, amount: fiatAmount }
            : {
                asset: displayCurrencyCode,
                network: infiniteNetwork
                // Don't provide amount for sell when we have fiat amount
              },
        target:
          direction === 'buy'
            ? { asset: displayCurrencyCode, network: infiniteNetwork }
            : { asset: cleanFiatCode, amount: fiatAmount } // Provide target amount for sell
      }

      const quoteResponse = await infiniteApi.createQuote(quoteParams)

      // Convert to RampQuoteResult - map based on direction
      const quote: RampQuoteResult = {
        pluginId,
        partnerIcon,
        pluginDisplayName,
        displayCurrencyCode,
        cryptoAmount:
          direction === 'buy'
            ? quoteResponse.target.amount.toString()
            : quoteResponse.source.amount.toString(),
        isEstimate: false,
        fiatCurrencyCode,
        fiatAmount:
          direction === 'buy'
            ? quoteResponse.source.amount.toString()
            : quoteResponse.target.amount.toString(),
        direction,
        regionCode,
        paymentType: 'directtobank', // Infinite uses bank transfers
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
          await withWorkflow(async () => {
            const { coreWallet } = approveParams

            // Authenticate with Infinite
            await authenticateWorkflow({
              account,
              infiniteApi,
              navigation,
              openWebView,
              pluginId,
              state,
              workflowState
            })

            // User needs to complete KYC
            await kycWorkflow({
              account,
              infiniteApi,
              navigation,
              openWebView,
              pluginId,
              state,
              workflowState
            })

            // Ensure we have a bank account
            await bankAccountWorkflow({
              account,
              infiniteApi,
              navigation,
              openWebView,
              pluginId,
              state,
              workflowState
            })

            const bankAccountId = state.bankAccountId
            if (bankAccountId == null) {
              throw new Error('Bank account ID is missing')
            }

            // Get fresh quote before confirmation using existing params
            const freshQuote = await infiniteApi.createQuote(quoteParams)

            // Show confirmation screen
            const confirmed = await confirmationWorkflow(
              {
                account,
                infiniteApi,
                navigation,
                openWebView,
                pluginId,
                state,
                workflowState
              },
              {
                fiatCurrencyCode: cleanFiatCode,
                fiatAmount:
                  direction === 'buy'
                    ? freshQuote.source.amount.toString()
                    : freshQuote.target.amount.toString(),
                cryptoCurrencyCode: displayCurrencyCode,
                cryptoAmount:
                  direction === 'buy'
                    ? freshQuote.target.amount.toString()
                    : freshQuote.source.amount.toString(),
                direction
              }
            )

            if (!confirmed) {
              return
            }

            // Create the transfer
            if (direction === 'buy') {
              // For buy (onramp), source is bank account
              const receiveAddress = await coreWallet.getReceiveAddress({
                tokenId
              })

              const transferParams = {
                type: flow,
                amount: freshQuote.source.amount,
                source: {
                  currency: cleanFiatCode.toLowerCase(),
                  network: 'wire', // Default to wire for bank transfers
                  accountId: bankAccountId
                },
                destination: {
                  currency: displayCurrencyCode.toLowerCase(),
                  network: infiniteNetwork,
                  toAddress: receiveAddress.publicAddress
                },
                clientReferenceId: `edge_${Date.now()}`
              }

              const transfer = await infiniteApi.createTransfer(transferParams)

              // Show deposit instructions for bank transfer with replace
              const instructions = transfer.sourceDepositInstructions
              if (
                instructions?.bankName != null &&
                instructions.amount != null
              ) {
                navigation.replace('rampBankRoutingDetails', {
                  bank: {
                    name: instructions.bankName,
                    accountNumber: instructions.bankAccountNumber || '',
                    routingNumber: instructions.bankRoutingNumber || ''
                  },
                  fiatCurrencyCode: cleanFiatCode,
                  fiatAmount: instructions.amount.toString()
                })
              }
              // Log the event
              onLogEvent('Buy_Success', {
                conversionValues: {
                  conversionType: 'buy',
                  sourceFiatCurrencyCode: fiatCurrencyCode,
                  sourceFiatAmount: freshQuote.source.amount.toString(),
                  destAmount: new CryptoAmount({
                    currencyConfig: coreWallet.currencyConfig,
                    currencyCode: displayCurrencyCode,
                    exchangeAmount: freshQuote.target.amount.toString()
                  }),
                  fiatProviderId: pluginId,
                  orderId: transfer.id
                }
              })
            } else {
              // For sell (offramp), destination is bank account
              const receiveAddress = await coreWallet.getReceiveAddress({
                tokenId
              })

              const transferParams = {
                type: flow,
                amount: freshQuote.source.amount,
                source: {
                  currency: displayCurrencyCode.toLowerCase(),
                  network: infiniteNetwork,
                  fromAddress: receiveAddress.publicAddress
                },
                destination: {
                  currency: cleanFiatCode.toLowerCase(),
                  network: 'ach', // Default to ACH for bank transfers
                  accountId: bankAccountId
                },
                clientReferenceId: `edge_${Date.now()}`
              }

              const transfer = await infiniteApi.createTransfer(transferParams)

              // Show deposit instructions
              if (transfer.sourceDepositInstructions?.toAddress != null) {
                // TODO: Show deposit address to user
                showToast(
                  `Send ${displayCurrencyCode} to: ${transfer.sourceDepositInstructions.toAddress}`
                )
              }

              // Log the event
              onLogEvent('Sell_Success', {
                conversionValues: {
                  conversionType: 'sell',
                  destFiatCurrencyCode: fiatCurrencyCode,
                  destFiatAmount: freshQuote.target.amount.toString(),
                  sourceAmount: new CryptoAmount({
                    currencyConfig: coreWallet.currencyConfig,
                    currencyCode: displayCurrencyCode,
                    exchangeAmount: freshQuote.source.amount.toString()
                  }),
                  fiatProviderId: pluginId,
                  orderId: transfer.id
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
