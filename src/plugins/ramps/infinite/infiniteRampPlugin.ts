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
import type { InfiniteQuoteFlow } from './infiniteApiTypes'
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
}

// Supported currencies
const SUPPORTED_FIAT_CODES = ['USD']
const SUPPORTED_CRYPTO_ASSETS: Record<string, string[]> = {
  ethereum: ['USDC', 'USDT', 'DAI'],
  polygon: ['USDC', 'USDT'],
  avalanche: ['USDC', 'USDT'],
  arbitrum: ['USDC', 'USDT'],
  optimism: ['USDC', 'USDT'],
  base: ['USDC'],
  binancesmartchain: ['USDC', 'USDT', 'BUSD'],
  bitcoin: ['BTC'],
  litecoin: ['LTC'],
  bitcoincash: ['BCH'],
  dogecoin: ['DOGE'],
  stellar: ['XLM'],
  ripple: ['XRP'],
  solana: ['SOL', 'USDC']
}

// Helper functions
const isFiatSupported = (fiatCode: string): boolean => {
  const cleanFiatCode = removeIsoPrefix(fiatCode).toUpperCase()
  return SUPPORTED_FIAT_CODES.includes(cleanFiatCode)
}

const isCryptoSupported = (pluginId: string, currencyCode: string): boolean => {
  const supportedCodes = SUPPORTED_CRYPTO_ASSETS[pluginId]
  return supportedCodes != null && supportedCodes.includes(currencyCode)
}

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

        // Check region support (US only for now)
        if (regionCode.countryCode !== 'US') {
          return { supported: false }
        }

        // Check fiat support
        if (!isFiatSupported(fiatAsset.currencyCode)) {
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

        // Check crypto asset support
        if (!isCryptoSupported(cryptoAsset.pluginId, currencyCode)) {
          return { supported: false }
        }

        // Check direction support (both buy and sell supported)
        if (direction !== 'buy' && direction !== 'sell') {
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

        // Fetch quote from API
        const cleanFiatCode = removeIsoPrefix(fiatCurrencyCode).toUpperCase()
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
                direction
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
                    address: await coreWallet
                      .getReceiveAddress({ tokenId })
                      .then(r => r.publicAddress),
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
