import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import {
  showToast,
  showToastSpinner
} from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import type { EmailContactInfo } from '../../../types/FormTypes'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { removeIsoPrefix } from '../../../util/utils'
import { rampDeeplinkManager } from '../rampDeeplinkHandler'
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

// Storage keys
const INFINITE_PRIVATE_KEY = 'infinite_auth_private_key'

// Plugin state interface
interface InfinitePluginState {
  privateKey?: Uint8Array
  customerId?: string
  bankAccountId?: string
  kycStatus?: 'pending' | 'approved' | 'rejected'
}

// Utility to convert hex string to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

// Utility to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
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

  // Helper function to authenticate with Infinite
  const authenticateWithInfinite = async (): Promise<{
    hasCustomer: boolean
  }> => {
    // Check if we already have a private key
    let privateKey = state.privateKey
    if (privateKey == null) {
      // Try to load from storage (stored as hex string)
      const itemIds = await account.dataStore.listItemIds(pluginId)
      if (itemIds.includes(INFINITE_PRIVATE_KEY)) {
        const storedKeyHex = await account.dataStore.getItem(
          pluginId,
          INFINITE_PRIVATE_KEY
        )
        // Convert hex string back to Uint8Array
        privateKey = hexToBytes(storedKeyHex)
      } else {
        // Generate new private key
        privateKey = infiniteApi.createPrivateKey()
        // Save to storage as hex string
        await account.dataStore.setItem(
          pluginId,
          INFINITE_PRIVATE_KEY,
          bytesToHex(privateKey)
        )
      }
      state.privateKey = privateKey
    }

    // Get public key from private key
    const publicKey = infiniteApi.getPublicKeyFromPrivate(privateKey)

    // Get challenge
    const challengeResponse = await infiniteApi.getChallenge(publicKey)

    // Sign the challenge message
    const signature = infiniteApi.signChallenge(
      challengeResponse.message,
      privateKey
    )

    // Verify signature
    const authResponse = await infiniteApi.verifySignature({
      public_key: publicKey,
      signature,
      nonce: challengeResponse.nonce,
      platform: 'mobile'
    })

    return { hasCustomer: authResponse.onboarded }
  }

  // Helper function to handle KYC flow
  const handleKycFlow = async (): Promise<boolean> => {
    return await new Promise<boolean>((resolve, reject) => {
      navigation.navigate('kycForm', {
        headerTitle: lstrings.ramp_plugin_kyc_title,
        onSubmit: async (contactInfo: EmailContactInfo) => {
          try {
            // Create customer profile
            const customerResponse = await infiniteApi.createCustomer({
              type: 'individual',
              countryCode: 'US',
              data: {
                personalInfo: {
                  firstName: contactInfo.firstName,
                  lastName: contactInfo.lastName
                },
                companyInformation: undefined,
                contactInformation: {
                  email: contactInfo.email
                }
              }
            })

            // Store customer ID
            state.customerId = customerResponse.customer.id

            // Register deeplink handler
            rampDeeplinkManager.register('buy', 'infinite', _link => {
              // KYC completed, close webview and continue
              if (Platform.OS === 'ios') {
                SafariView.dismiss()
              }
              state.kycStatus = 'approved'
              resolve(true)
            })

            // Open KYC webview
            await openWebView(customerResponse.kycLinkUrl)
          } catch (error: any) {
            reject(error)
          }
        },
        onClose: () => {
          resolve(false)
        }
      })
    })
  }

  // Helper function to ensure bank account exists
  const ensureBankAccount = async (): Promise<string> => {
    // Get existing bank accounts
    const bankAccounts = await infiniteApi.getBankAccounts()

    if (bankAccounts.length > 0) {
      // Use the first bank account
      const bankAccountId = bankAccounts[0].id
      state.bankAccountId = bankAccountId
      return bankAccountId
    }

    // Need to add a bank account
    return await new Promise((resolve, reject) => {
      navigation.navigate('rampBankForm', {
        onSubmit: async formData => {
          try {
            const bankAccount = await infiniteApi.addBankAccount(formData)
            state.bankAccountId = bankAccount.id
            resolve(bankAccount.id)
          } catch (error: any) {
            reject(error)
          }
        }
      })
    })
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

            const { hasCustomer } = await showToastSpinner(
              sprintf(
                lstrings.ramp_plugin_authenticating_with_s,
                pluginDisplayName
              ),
              async (): Promise<{ hasCustomer: boolean }> => {
                // Check if authenticated
                if (!infiniteApi.isAuthenticated()) {
                  // Need to authenticate
                  const { hasCustomer } = await authenticateWithInfinite()
                  return {
                    hasCustomer
                  }
                }
                const state = infiniteApi.getAuthState()
                const hasCustomer = state.token === '' // TODO use the state to determine if the user has a customer, or if the customer is in the onboarded state
                return {
                  hasCustomer
                }
              }
            )

            if (!hasCustomer) {
              // User needs to complete KYC
              const kycResult = await handleKycFlow()
              if (!kycResult) {
                // User must have cancelled KYC
                return
              }
            }

            await showToastSpinner(
              lstrings.fiat_plugin_finalizing_quote,
              (async () => {
                // Ensure we have a bank account
                const bankAccountId = await ensureBankAccount()

                // Create the transfer
                if (direction === 'buy') {
                  // For buy (onramp), source is bank account
                  const transferParams = {
                    type: flow,
                    quoteId: quoteResponse.quoteId,
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

                  // Show deposit instructions for bank transfer
                  const instructions = transfer.data.sourceDepositInstructions
                  if (instructions?.bank != null) {
                    showToast(
                      `Please send $${instructions.amount} to:\n` +
                        `Bank: ${instructions.bank.name}\n` +
                        `Account: ${instructions.bank.accountNumber}\n` +
                        `Routing: ${instructions.bank.routingNumber}\n` +
                        `Memo: ${instructions.memo || 'N/A'}`
                    )
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
              })()
            )

            navigation.pop()
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
