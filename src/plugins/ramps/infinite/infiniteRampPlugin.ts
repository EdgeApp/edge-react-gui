import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { showToast } from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { removeIsoPrefix } from '../../../util/utils'
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
  EDGE_TO_INFINITE_NETWORK_MAP
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
  kycSceneShown?: boolean
  bankFormShown?: boolean
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
  const { apiKey, apiUrl, orgId } = asInitOptions(config.initOptions)
  const { account, navigation, onLogEvent } = config

  // Create API instance for this plugin
  const infiniteApi = makeInfiniteApi({ apiKey, apiUrl, orgId })

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

  // Helper function to open webview
  const openWebView = async (url: string): Promise<void> => {
    if (Platform.OS === 'ios') {
      await SafariView.show({ url })
    } else {
      await CustomTabs.openURL(url)
    }
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
      try {
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

        // Only support fiat amounts for now
        if (amountType !== 'fiat') {
          return []
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
          return []
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

        if (!country?.supportedFiatCurrencies.includes(cleanFiatCode)) {
          return []
        }

        // Check if payment methods are available for the direction
        const paymentMethods =
          direction === 'buy'
            ? country.supportedPaymentMethods.onRamp
            : country.supportedPaymentMethods.offRamp

        if (paymentMethods.length === 0) {
          return []
        }

        // Get crypto currency info
        const targetCurrency = currencies.currencies.find(
          c => c.code === displayCurrencyCode && c.type === 'crypto'
        )

        if (targetCurrency == null) {
          return []
        }

        // Verify crypto currency supports the direction and country
        const directionSupported =
          (direction === 'buy' && targetCurrency.supportsOnRamp) ||
          (direction === 'sell' && targetCurrency.supportsOffRamp)

        if (!directionSupported) {
          return []
        }

        const supportedCountries =
          direction === 'buy'
            ? targetCurrency.onRampCountries
            : targetCurrency.offRampCountries

        if (
          supportedCountries != null &&
          !supportedCountries.includes(country.code)
        ) {
          return []
        }

        // Check amount limits
        const minAmount = parseFloat(targetCurrency.minAmount)
        const maxAmount = parseFloat(targetCurrency.maxAmount)

        if (fiatAmount < minAmount || fiatAmount > maxAmount) {
          return []
        }

        // Fetch quote from API
        const flow: InfiniteQuoteFlow =
          direction === 'buy' ? 'ONRAMP' : 'OFFRAMP'

        const quoteParams = {
          flow,
          source:
            direction === 'buy'
              ? { asset: cleanFiatCode, amount: fiatAmount }
              : {
                  asset: displayCurrencyCode,
                  network: infiniteNetwork,
                  amount: 0
                }, // Will calculate crypto amount
          target:
            direction === 'buy'
              ? { asset: displayCurrencyCode, network: infiniteNetwork }
              : { asset: cleanFiatCode }
        }

        // For sell, we need to calculate the crypto amount from fiat
        if (direction === 'sell') {
          // TODO: This is a simplified calculation, should use proper rate
          // For now, assume 1:1 for stablecoins
          const cryptoAmount = fiatAmount
          quoteParams.source.amount = cryptoAmount
        }

        const quoteResponse = await infiniteApi.createQuote(quoteParams)

        // Convert to RampQuoteResult
        const quote: RampQuoteResult = {
          pluginId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode,
          cryptoAmount: quoteResponse.target.amount.toString(),
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount: quoteResponse.source.amount.toString(),
          direction,
          regionCode,
          paymentType: 'directtobank', // Infinite uses bank transfers
          expirationDate: new Date(quoteResponse.expiresAt),
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
                state
              })

              // User needs to complete KYC
              await kycWorkflow({
                account,
                infiniteApi,
                navigation,
                openWebView,
                pluginId,
                state
              })

              // Ensure we have a bank account
              await bankAccountWorkflow({
                account,
                infiniteApi,
                navigation,
                openWebView,
                pluginId,
                state
              })

              const bankAccountId = state.bankAccountId
              if (bankAccountId == null) {
                throw new Error('Bank account ID is missing')
              }

              // Get fresh quote before confirmation using existing params
              const freshQuote = await infiniteApi.createQuote(quoteParams)

              // Show confirmation screen
              // Replace if KYC scene was shown but bank form wasn't
              // (i.e., when we had existing bank accounts)
              const shouldReplace =
                state.kycSceneShown === true && state.bankFormShown === false

              const confirmed = await confirmationWorkflow(navigation, {
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
                direction,
                replace: shouldReplace
              })

              if (!confirmed) {
                return
              }

              // Use fresh quote for transfer
              const finalQuoteId = freshQuote.quoteId

              // Create the transfer
              if (direction === 'buy') {
                // For buy (onramp), source is bank account
                const transferParams = {
                  type: flow,
                  quoteId: finalQuoteId,
                  source: { accountId: bankAccountId },
                  destination: {
                    address: (await coreWallet.getReceiveAddress({ tokenId }))
                      .publicAddress,
                    asset: displayCurrencyCode,
                    network: infiniteNetwork
                  },
                  autoExecute: true
                }

                const transfer = await infiniteApi.createTransfer(
                  transferParams
                )

                // Show deposit instructions for bank transfer with replace
                const instructions = transfer.data.sourceDepositInstructions
                if (instructions?.bank != null && instructions.amount != null) {
                  navigation.replace('rampBankRoutingDetails', {
                    bank: {
                      name: instructions.bank.name,
                      accountNumber: instructions.bank.accountNumber,
                      routingNumber: instructions.bank.routingNumber
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
                    sourceFiatAmount: quoteResponse.source.amount.toString(),
                    destAmount: new CryptoAmount({
                      currencyConfig: coreWallet.currencyConfig,
                      currencyCode: displayCurrencyCode,
                      exchangeAmount: quoteResponse.target.amount.toString()
                    }),
                    fiatProviderId: pluginId,
                    orderId: transfer.data.id
                  }
                })
              } else {
                // For sell (offramp), destination is bank account
                const receiveAddress = await coreWallet.getReceiveAddress({
                  tokenId
                })

                const transferParams = {
                  type: flow,
                  quoteId: finalQuoteId,
                  source: {
                    address: receiveAddress.publicAddress,
                    asset: displayCurrencyCode,
                    amount: parseFloat(quoteResponse.source.amount.toString()),
                    network: infiniteNetwork
                  },
                  destination: {
                    accountId: bankAccountId
                  },
                  autoExecute: true
                }

                const transfer = await infiniteApi.createTransfer(
                  transferParams
                )

                // Show deposit instructions
                if (
                  transfer.data.sourceDepositInstructions?.depositAddress !=
                  null
                ) {
                  // TODO: Show deposit address to user
                  showToast(
                    `Send ${displayCurrencyCode} to: ${transfer.data.sourceDepositInstructions.depositAddress}`
                  )
                }

                // Log the event
                onLogEvent('Sell_Success', {
                  conversionValues: {
                    conversionType: 'sell',
                    destFiatCurrencyCode: fiatCurrencyCode,
                    destFiatAmount: quoteResponse.target.amount.toString(),
                    sourceAmount: new CryptoAmount({
                      currencyConfig: coreWallet.currencyConfig,
                      currencyCode: displayCurrencyCode,
                      exchangeAmount: quoteResponse.source.amount.toString()
                    }),
                    fiatProviderId: pluginId,
                    orderId: transfer.data.id
                  }
                })
              }
            })
          },
          closeQuote: async (): Promise<void> => {}
        }

        return [quote]
      } catch (error) {
        console.error('Infinite: Error in fetchQuote:', error)
        return []
      }
    }
  }

  return plugin
}
