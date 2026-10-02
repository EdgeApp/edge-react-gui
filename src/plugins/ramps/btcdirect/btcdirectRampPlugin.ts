import type { EdgeTokenId } from 'edge-core-js'

import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { caip19ToEdgeAsset } from '../../../util/caip19Utils'
import { makeUuid } from '../../../util/rnUtils'
import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
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
import { asInitOptions } from './btcdirectRampTypes'
import {
  type BtcDirectCurrencyPair,
  type BtcDirectPaymentMethods,
  type BtcDirectQuote,
  makeBtcDirectApi,
  makeCachedPromise
} from './util/fetchBtcDirect'

interface BtcDirectAsset {
  pluginId: string
  tokenId: EdgeTokenId
  pair: BtcDirectCurrencyPair
}

interface ProviderConfig {
  assets: BtcDirectAsset[]
  paymentMethods: BtcDirectPaymentMethods
}

const pluginId = 'btcdirect'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/btcdirect.png`
const pluginDisplayName = 'BTC Direct'

// BTC Direct only settles buy orders in EUR
const FIAT_CURRENCY_CODE = 'EUR'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// BTC Direct sends the user to the return URL as-is after the checkout, both
// when the order completes and when the user cancels it.
const RETURN_URL = 'https://return.edge.app/fiatprovider/buy/btcdirect'

/**
 * Edge payment types mapped to the case-sensitive BTC Direct payment method
 * codes.
 */
const PAYMENT_METHOD_CODES: Array<[FiatPaymentType, string]> = [
  ['credit', 'creditCard'],
  ['ideal', 'iDeal'],
  ['sepa', 'bankTransfer']
]

/**
 * BTC Direct currency codes mapped to the Edge plugin of their native asset.
 * Only used for a currency that comes without a CAIP-19 identifier.
 */
const NATIVE_ASSET_PLUGIN_IDS: Record<string, string> = {
  ADA: 'cardano',
  ALGO: 'algorand',
  AVAX: 'avalanche',
  BCH: 'bitcoincash',
  BNB: 'binancesmartchain',
  BTC: 'bitcoin',
  DOGE: 'dogecoin',
  ETC: 'ethereumclassic',
  ETH: 'ethereum',
  HBAR: 'hedera',
  LTC: 'litecoin',
  POL: 'polygon',
  SOL: 'solana',
  TRX: 'tron',
  XLM: 'stellar',
  XRP: 'ripple'
}

export const btcdirectRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
) => {
  const { apiUrl, username, password } = asInitOptions(config.initOptions)
  const { account } = config
  const api = makeBtcDirectApi({ apiUrl, username, password })

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  async function fetchProviderConfig(): Promise<ProviderConfig> {
    const [pairs, paymentMethods] = await Promise.all([
      api.fetchCurrencyPairs(),
      api.fetchPaymentMethods()
    ])

    const assets: BtcDirectAsset[] = []
    for (const pair of pairs) {
      if (pair.quoteCurrency.code !== FIAT_CURRENCY_CODE) continue
      if (pair.buy.status !== 'enabled') continue
      const asset = getEdgeAsset(account, pair)
      if (asset == null) continue
      assets.push({ ...asset, pair })
    }

    return { assets, paymentMethods }
  }

  const providerConfigCache = makeCachedPromise(
    fetchProviderConfig,
    CACHE_TTL_MS
  )

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const { direction, regionCode, fiatAsset, cryptoAsset } = request

      if (direction !== 'buy') return { supported: false }
      if (removeIsoPrefix(fiatAsset.currencyCode) !== FIAT_CURRENCY_CODE) {
        return { supported: false }
      }

      const providerConfig = await providerConfigCache.get()

      const asset = findAsset(
        providerConfig.assets,
        cryptoAsset.pluginId,
        cryptoAsset.tokenId
      )
      if (asset == null) return { supported: false }

      const paymentTypes = getPaymentTypes(
        providerConfig.paymentMethods,
        regionCode.countryCode
      ).map(([paymentType]) => paymentType)
      if (paymentTypes.length === 0) return { supported: false }

      // Global constraints check
      const constraintOk = validateRampCheckSupportRequest(
        pluginId,
        request,
        paymentTypes
      )
      if (!constraintOk) return { supported: false }

      return { supported: true, supportedAmountTypes: ['fiat'] }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const {
        amountQuery,
        amountType,
        direction,
        displayCurrencyCode,
        fiatCurrencyCode,
        regionCode,
        tokenId
      } = request
      const currencyPluginId = request.wallet.currencyInfo.pluginId

      if (direction !== 'buy') return []
      if (amountType !== 'fiat') return []
      if (removeIsoPrefix(fiatCurrencyCode) !== FIAT_CURRENCY_CODE) return []

      const providerConfig = await providerConfigCache.get()

      const asset = findAsset(providerConfig.assets, currencyPluginId, tokenId)
      if (asset == null) return []
      const { pair } = asset

      const isMaxAmount =
        'max' in amountQuery || 'maxExchangeAmount' in amountQuery
      const exchangeAmount =
        'exchangeAmount' in amountQuery ? amountQuery.exchangeAmount : ''
      const maxAmountLimit =
        'maxExchangeAmount' in amountQuery
          ? amountQuery.maxExchangeAmount
          : undefined

      const fetchMethodQuote = async (
        paymentType: FiatPaymentType,
        paymentMethod: string
      ): Promise<RampQuote | undefined> => {
        // Constraints per request
        if (!validateRampQuoteRequest(pluginId, request, paymentType)) {
          return
        }

        const minLimit = pair.buy.min?.amount
        const maxLimit = getMaxLimit(
          pair,
          providerConfig.paymentMethods,
          paymentMethod
        )

        let amount: number
        if (isMaxAmount) {
          if (maxLimit == null) return
          amount = maxLimit
        } else {
          amount = parseFloat(exchangeAmount)
          if (Number.isNaN(amount)) return
        }
        checkLimits(amount, minLimit, maxLimit)

        let quoteData = await api.fetchQuote({
          currencyPair: pair.currencyPair,
          paymentMethod,
          fiatAmount: amount
        })

        // Scale the fiat amount down when the max quote buys more crypto
        // than the requested cap:
        if (maxAmountLimit != null) {
          const capValue = parseFloat(maxAmountLimit)
          if (
            !Number.isNaN(capValue) &&
            quoteData.cryptoAmount > 0 &&
            capValue < quoteData.cryptoAmount
          ) {
            amount = roundFiat((amount * capValue) / quoteData.cryptoAmount)
            checkLimits(amount, minLimit, maxLimit)
            quoteData = await api.fetchQuote({
              currencyPair: pair.currencyPair,
              paymentMethod,
              fiatAmount: amount
            })
          }
        }

        const fiatAmount = quoteData.fiatAmount.toString()
        const cryptoAmount = quoteData.cryptoAmount.toString()

        let deeplinkToken: string | undefined

        return {
          pluginId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode,
          cryptoAmount,
          isEstimate: false,
          fiatCurrencyCode,
          fiatAmount,
          direction,
          expirationDate: getExpirationDate(quoteData),
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

            const orderId = await makeUuid()

            const { checkoutUrl } = await api.createCheckout({
              baseCurrency: pair.baseCurrency.code,
              quoteCurrency: FIAT_CURRENCY_CODE,
              paymentMethod,
              quoteCurrencyAmount: quoteData.fiatAmount,
              walletAddress,
              returnUrl: `${RETURN_URL}?orderId=${orderId}`,
              partnerOrderIdentifier: orderId
            })

            deeplinkToken = await openExternalWebView({
              url: checkoutUrl,
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
                  // The return link only brings the user back to Edge. It
                  // carries no order status, because BTC Direct uses the same
                  // return URL for a completed and a cancelled checkout. A
                  // purchase therefore cannot be reported as successful here.
                }
              }
            })
          },

          closeQuote: async () => {
            // Cleanup deeplink handler
            if (deeplinkToken != null)
              rampDeeplinkManager.unregister(deeplinkToken)
          }
        }
      }

      // Quote every payment method at once, keeping their order:
      const results = await Promise.all(
        getPaymentTypes(
          providerConfig.paymentMethods,
          regionCode.countryCode
        ).map(async ([paymentType, paymentMethod]) => {
          try {
            return { quote: await fetchMethodQuote(paymentType, paymentMethod) }
          } catch (error: unknown) {
            return { error }
          }
        })
      )

      const quotes: RampQuote[] = []
      const errors: unknown[] = []
      for (const result of results) {
        if ('error' in result) errors.push(result.error)
        else if (result.quote != null) quotes.push(result.quote)
      }

      if (quotes.length === 0 && errors.length > 0) throw errors[0]

      return quotes
    }
  }

  return plugin
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function removeIsoPrefix(currencyCode: string): string {
  return currencyCode.replace(/^iso:/, '')
}

/**
 * Finds the Edge asset for a BTC Direct currency pair. The CAIP-19 identifier
 * is authoritative, since it also identifies tokens. A currency without one is
 * matched by its code against the known native assets.
 */
function getEdgeAsset(
  account: RampPluginConfig['account'],
  pair: BtcDirectCurrencyPair
): { pluginId: string; tokenId: EdgeTokenId } | undefined {
  const { caip19, code } = pair.baseCurrency
  if (caip19 != null) return caip19ToEdgeAsset(account, caip19)

  const nativePluginId = NATIVE_ASSET_PLUGIN_IDS[code]
  if (nativePluginId == null) return
  if (account.currencyConfig[nativePluginId] == null) return
  return { pluginId: nativePluginId, tokenId: null }
}

function findAsset(
  assets: BtcDirectAsset[],
  currencyPluginId: string,
  tokenId: EdgeTokenId
): BtcDirectAsset | undefined {
  return assets.find(
    asset => asset.pluginId === currencyPluginId && asset.tokenId === tokenId
  )
}

/**
 * Returns the Edge payment types, with their BTC Direct payment method codes,
 * that BTC Direct offers in a country.
 */
function getPaymentTypes(
  paymentMethods: BtcDirectPaymentMethods,
  countryCode: string
): Array<[FiatPaymentType, string]> {
  const countryMethods = paymentMethods.countries[countryCode.toLowerCase()]
  if (countryMethods == null) return []
  return PAYMENT_METHOD_CODES.filter(
    ([, code]) =>
      countryMethods.includes(code) &&
      paymentMethods.paymentMethods.some(method => method.code === code)
  )
}

/**
 * The maximum fiat amount is the lower of the currency pair maximum and the
 * payment method limit.
 */
function getMaxLimit(
  pair: BtcDirectCurrencyPair,
  paymentMethods: BtcDirectPaymentMethods,
  paymentMethod: string
): number | undefined {
  const pairMax = pair.buy.max?.amount
  const methodLimit = paymentMethods.paymentMethods.find(
    method => method.code === paymentMethod
  )?.limit
  if (pairMax == null) return methodLimit
  if (methodLimit == null) return pairMax
  return Math.min(pairMax, methodLimit)
}

function checkLimits(
  amount: number,
  minLimit: number | undefined,
  maxLimit: number | undefined
): void {
  if (minLimit != null && amount < minLimit) {
    throw new FiatProviderError({
      providerId: pluginId,
      errorType: 'underLimit',
      errorAmount: minLimit,
      displayCurrencyCode: FIAT_CURRENCY_CODE
    })
  }
  if (maxLimit != null && amount > maxLimit) {
    throw new FiatProviderError({
      providerId: pluginId,
      errorType: 'overLimit',
      errorAmount: maxLimit,
      displayCurrencyCode: FIAT_CURRENCY_CODE
    })
  }
}

function roundFiat(amount: number): number {
  return Math.floor(amount * 100) / 100
}

function getExpirationDate(quote: BtcDirectQuote): Date {
  if (quote.expiryDate != null) {
    const expiryDate = new Date(quote.expiryDate)
    if (!Number.isNaN(expiryDate.valueOf())) return expiryDate
  }
  // Assume 1 minute expiration
  return new Date(Date.now() + 1000 * 60)
}
