import {
  showToast,
  showToastSpinner
} from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
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
import { makeInfiniteApi } from './infiniteApi'
import type { InfiniteQuoteFlow } from './infiniteApiTypes'
import {
  asInitOptions,
  EDGE_TO_INFINITE_NETWORK_MAP
} from './infiniteRampTypes'

const pluginId = 'infinite'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/infinite.png`
const pluginDisplayName = 'Infinite'

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
  const { apiUrl, orgId } = asInitOptions(config.initOptions)
  const { account, navigation, onLogEvent } = config

  // Create API instance for this plugin
  const infiniteApi = makeInfiniteApi({ apiUrl, orgId })

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

        // // Ensure we have authentication
        // if (!infiniteApi.isAuthenticated()) {
        //   // For now, we'll skip authentication
        //   // TODO: Implement wallet-based auth when ready
        //   console.log('Infinite: Authentication required')
        //   return []
        // }

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
            const { coreWallet } = approveParams

            try {
              await showToastSpinner(
                lstrings.fiat_plugin_finalizing_quote,
                (async () => {
                  // Create the transfer
                  if (direction === 'buy') {
                    // For buy, we need a bank account ID
                    // TODO: Implement bank account management
                    throw new Error('Bank account management not implemented')
                  } else {
                    // For sell, get the wallet address
                    // TODO: getReceiveAddress is deprecated but no replacement API exists yet
                    // @ts-ignore - Using deprecated method until replacement is available
                    const receiveAddress = await coreWallet.getReceiveAddress({
                      tokenId
                    })

                    const transferParams = {
                      type: flow,
                      quoteId: quoteResponse.quoteId,
                      source: {
                        address: receiveAddress.publicAddress,
                        asset: displayCurrencyCode,
                        amount: parseFloat(
                          quoteResponse.source.amount.toString()
                        ),
                        network: infiniteNetwork
                      },
                      destination: {
                        // TODO: Need bank account ID for sell
                        accountId: 'acct_bank_placeholder'
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
                })()
              )

              navigation.pop()
            } catch (error: any) {
              showToast(error.message)
            }
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
