import { eq, lte, mul, round } from 'biggystring'
import {
  asArray,
  asBoolean,
  asDate,
  asMaybe,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type {
  EdgeAssetAction,
  EdgeFetchOptions,
  EdgeSpendInfo,
  EdgeTransaction,
  EdgeTxActionFiat,
  JsonObject
} from 'edge-core-js'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast,
  showToastSpinner
} from '../../../components/services/AirshipInstance'
import { requestPermissionOnSettings } from '../../../components/services/PermissionsManager'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { locale } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import type { FiatProviderLink } from '../../../types/DeepLinkTypes'
import type { EdgeAsset, StringMap } from '../../../types/types'
import { sha512HashAndSign } from '../../../util/crypto'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getCurrencyCodeMultiplier } from '../../../util/CurrencyInfoHelpers'
import { removeIsoPrefix } from '../../../util/utils'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import type {
  FiatDirection,
  FiatPaymentType,
  FiatPluginRegionCode,
  SaveTxActionParams
} from '../../gui/fiatPluginTypes'
import type {
  FiatProviderAssetMap,
  FiatProviderSupportedRegions
} from '../../gui/fiatProviderTypes'
import { assert, isWalletTestnet } from '../../gui/pluginUtils'
import {
  NOT_SUCCESS_TOAST_HIDE_MS,
  RETURN_URL_FAIL,
  RETURN_URL_PAYMENT,
  RETURN_URL_SUCCESS,
  validateRegion
} from '../../gui/providers/common'
import { addTokenToArray } from '../../gui/util/providerUtils'
import { rampDeeplinkManager } from '../rampDeeplinkHandler'
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
import { asInitOptions } from './paybisRampTypes'

const pluginId = 'paybis'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/paybis.png`
const pluginDisplayName = 'Paybis'

// Cache for max amounts with 2 minute TTL
const maxAmountCache = new Map<string, { amount: string; timestamp: number }>()
const MAX_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

const getCacheKey = (
  direction: FiatDirection,
  fiatCode: string,
  cryptoCode: string,
  amountType: 'fiat' | 'crypto',
  paymentMethod: string
): string => {
  return `${direction}-${fiatCode}-${cryptoCode}-${amountType}-${paymentMethod}`
}
const providerDisplayName = pluginDisplayName
const supportEmail = 'support@paybis.com'

type AllowedPaymentTypes = Record<
  FiatDirection,
  Partial<Record<FiatPaymentType, boolean>>
>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    iach: true,
    applepay: true,
    credit: true,
    googlepay: true,
    pix: true,
    pse: true,
    revolut: true,
    spei: true
  },
  sell: {
    iach: true,
    colombiabank: true,
    credit: true,
    mexicobank: true,
    pix: true
  }
}

const asPaymentMethodId = asValue(
  'method-id-credit-card',
  'method-id-credit-card-out',
  'method-id_bridgerpay_revolutpay',
  'method-id-trustly',
  'fake-id-googlepay',
  'fake-id-applepay',
  'method-id_bridgerpay_directa24_pse',
  'method-id_bridgerpay_directa24_colombia_payout',
  'method-id_bridgerpay_directa24_spei',
  'method-id_bridgerpay_directa24_mexico_payout',
  'method-id_bridgerpay_directa24_pix',
  'method-id_bridgerpay_directa24_pix_payout'
)

const asCurrencyAndCode = asObject({
  currency: asString,
  currencyCode: asString
})

const asPaymentMethodPair = asObject({
  from: asString,
  to: asArray(asCurrencyAndCode)
})

const asPaymentMethodPairs = asObject({
  name: asMaybe(asPaymentMethodId),
  pairs: asArray(asPaymentMethodPair)
})

const asPaybisBuyPairs = asObject({
  data: asArray(asPaymentMethodPairs)
})

const asSellPair = asObject({
  fromAssetId: asString,
  to: asArray(asString)
})

const asSellPaymentMethodPairs = asObject({
  name: asMaybe(asPaymentMethodId),
  pairs: asArray(asSellPair)
})

const asPaybisSellPairs = asObject({
  data: asArray(asSellPaymentMethodPairs)
})

const asAmountCurrency = asObject({
  amount: asString,
  currencyCode: asString
})

const asQuotePaymentMethod = asObject({
  id: asPaymentMethodId,
  amountTo: asAmountCurrency,
  amountFrom: asAmountCurrency,
  fees: asObject({
    networkFee: asAmountCurrency,
    serviceFee: asAmountCurrency,
    totalFee: asAmountCurrency
  }),
  expiration: asDate,
  expiresAt: asDate
})

const asQuotePaymentErrors = asObject({
  paymentMethod: asOptional(asPaymentMethodId),
  payoutMethod: asOptional(asPaymentMethodId),
  error: asObject({
    message: asString
  })
})

const asQuote = asObject({
  id: asString,
  currencyCodeTo: asString,
  currencyCodeFrom: asString,
  requestedAmount: asObject({
    amount: asString,
    currencyCode: asString
  }),
  requestedAmountType: asValue('from', 'to'),
  paymentMethods: asOptional(asArray(asQuotePaymentMethod)),
  payoutMethods: asOptional(asArray(asQuotePaymentMethod)),
  paymentMethodErrors: asOptional(asArray(asQuotePaymentErrors)),
  payoutMethodErrors: asOptional(asArray(asQuotePaymentErrors))
})

const asPaymentDetails = asObject({
  assetId: asString,
  blockchain: asString,
  network: asString,
  depositAddress: asString,
  destinationTag: asOptional(asString),
  currencyCode: asString,
  amount: asString
})

const asPublicRequestResponse = asObject({
  requestId: asString,
  oneTimeToken: asOptional(asString)
})

const asUserStatus = asObject({
  hasTransactions: asBoolean
})

type PaymentMethodId = ReturnType<typeof asPaymentMethodId>
type PaybisBuyPairs = ReturnType<typeof asPaybisBuyPairs>
type PaybisSellPairs = ReturnType<typeof asPaybisSellPairs>

interface ExtendedTokenId extends EdgeAsset {
  currencyCode?: string
}

const ensureIsoPrefix = (currencyCode: string): string => {
  return currencyCode.startsWith('iso:') ? currencyCode : `iso:${currencyCode}`
}

const WIDGET_URL = 'https://widget.paybis.com'
const WIDGET_URL_SANDBOX = 'https://widget.sandbox.paybis.com'

const FIAT_DECIMALS = -2
const CRYPTO_DECIMALS = -8

const PAYBIS_TO_EDGE_CURRENCY_MAP: Record<string, ExtendedTokenId> = {
  AAVE: {
    pluginId: 'ethereum',
    tokenId: '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'
  },
  ADA: { pluginId: 'cardano', tokenId: null },
  BAT: {
    pluginId: 'ethereum',
    tokenId: '0d8775f648430679a709e98d2b0cb6250d2887ef'
  },
  BCH: { pluginId: 'bitcoincash', tokenId: null },
  BNB: { pluginId: 'binancechain', tokenId: null },
  BTC: { pluginId: 'bitcoin', tokenId: null },
  'BTC-TESTNET': {
    currencyCode: 'TESTBTC',
    pluginId: 'bitcointestnet',
    tokenId: null
  },
  BUSD: {
    pluginId: 'binancesmartchain',
    tokenId: 'e9e7cea3dedca5984780bafc599bd69add087d56'
  },
  COMP: {
    pluginId: 'ethereum',
    tokenId: 'c00e94cb662c3520282e6f5717214004a7f26888'
  },
  CRV: {
    pluginId: 'ethereum',
    tokenId: 'd533a949740bb3306d119cc777fa900ba034cd52'
  },
  DAI: {
    pluginId: 'ethereum',
    tokenId: '6b175474e89094c44da98b954eedeac495271d0f'
  },
  DOGE: { pluginId: 'dogecoin', tokenId: null },
  DOT: { pluginId: 'polkadot', tokenId: null },
  ETH: { pluginId: 'ethereum', tokenId: null },
  KNC: {
    pluginId: 'ethereum',
    tokenId: 'defa4e8a7bcba345f687a2f1456f5edd9ce97202'
  },
  LINK: {
    pluginId: 'ethereum',
    tokenId: '514910771af9ca656af840dff83e8264ecf986ca'
  },
  LTC: { pluginId: 'litecoin', tokenId: null },
  MKR: {
    pluginId: 'ethereum',
    tokenId: '9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
  },
  POL: { currencyCode: 'POL', pluginId: 'polygon', tokenId: null },
  SHIB: {
    pluginId: 'ethereum',
    tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce'
  },
  SOL: { pluginId: 'solana', tokenId: null },
  SUSHI: {
    pluginId: 'ethereum',
    tokenId: '6b3595068778dd592e39a122f4f5a5cf09c90fe2'
  },
  TON: { pluginId: 'ton', tokenId: null },
  TRX: { pluginId: 'tron', tokenId: null },
  USDC: {
    pluginId: 'ethereum',
    tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  USDT: {
    pluginId: 'ethereum',
    tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7'
  },
  'USDT-TRC20': {
    currencyCode: 'USDT',
    pluginId: 'tron',
    tokenId: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  },
  WBTC: {
    pluginId: 'ethereum',
    tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  },
  XLM: { pluginId: 'stellar', tokenId: null },
  XRP: { pluginId: 'ripple', tokenId: null },
  XTZ: { pluginId: 'tezos', tokenId: null },
  YFI: {
    pluginId: 'ethereum',
    tokenId: '0bc529c00c6401aef6d220be8c6ea1667f6ad93e'
  }
}

const EDGE_TO_PAYBIS_CURRENCY_MAP: StringMap = Object.entries(
  PAYBIS_TO_EDGE_CURRENCY_MAP
).reduce((prev, [paybisCc, edgeToken]) => {
  return {
    ...prev,
    [`${edgeToken.pluginId}_${edgeToken.tokenId ?? ''}`]: paybisCc
  }
}, {})

const PAYMENT_METHOD_MAP: Record<PaymentMethodId, FiatPaymentType> = {
  'method-id-trustly': 'iach',
  'method-id-credit-card': 'credit',
  'method-id-credit-card-out': 'credit',
  'method-id_bridgerpay_revolutpay': 'revolut',
  'fake-id-googlepay': 'googlepay',
  'fake-id-applepay': 'applepay',
  'method-id_bridgerpay_directa24_pse': 'pse',
  'method-id_bridgerpay_directa24_colombia_payout': 'colombiabank',
  'method-id_bridgerpay_directa24_spei': 'spei',
  'method-id_bridgerpay_directa24_mexico_payout': 'mexicobank',
  'method-id_bridgerpay_directa24_pix': 'pix',
  'method-id_bridgerpay_directa24_pix_payout': 'pix'
}

const REVERSE_PAYMENT_METHOD_MAP: Partial<
  Record<FiatPaymentType, PaymentMethodId>
> = {
  iach: 'method-id-trustly',
  applepay: 'method-id-credit-card',
  credit: 'method-id-credit-card',
  googlepay: 'method-id-credit-card',
  pix: 'method-id_bridgerpay_directa24_pix',
  pse: 'method-id_bridgerpay_directa24_pse',
  revolut: 'method-id_bridgerpay_revolutpay',
  spei: 'method-id_bridgerpay_directa24_spei'
}

const SELL_REVERSE_PAYMENT_METHOD_MAP: Partial<
  Record<FiatPaymentType, PaymentMethodId>
> = {
  credit: 'method-id-credit-card-out',
  colombiabank: 'method-id_bridgerpay_directa24_colombia_payout',
  mexicobank: 'method-id_bridgerpay_directa24_mexico_payout',
  pix: 'method-id_bridgerpay_directa24_pix_payout'
}

const SUPPORTED_REGIONS: FiatProviderSupportedRegions = {
  US: {
    notStateProvinces: ['HI', 'NY']
  }
}

interface PaybisPairs {
  buy: PaybisBuyPairs | undefined
  sell: PaybisSellPairs | undefined
}

interface PaybisPluginState {
  apiKey: string
  partnerUrl: string
  privateKeyB64: string
  partnerUserId: string
}

const paybisFetch = async (params: {
  method: 'POST' | 'GET'
  url: string
  path: string
  apiKey: string
  bodyParams?: object
  queryParams?: JsonObject
  privateKey?: string
  promoCode?: string
}): Promise<JsonObject> => {
  const {
    method,
    url,
    path,
    apiKey,
    bodyParams,
    queryParams = {},
    promoCode,
    privateKey
  } = params
  const urlObj = new URL(url + '/' + path, true)
  const body = bodyParams != null ? JSON.stringify(bodyParams) : undefined

  let signature: string | undefined
  if (privateKey != null) {
    if (body == null) throw new Error('Paybis: Cannot sign without body')
    // Wait for next animation frame
    await new Promise(resolve => requestAnimationFrame(resolve))
    signature = sha512HashAndSign(body, privateKey)
  }
  queryParams.apikey = apiKey

  if (promoCode != null) {
    queryParams.promoCode = promoCode
  }
  urlObj.set('query', queryParams)

  const options: EdgeFetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  if (signature != null) {
    options.headers = {
      ...options.headers,
      'x-request-signature': signature
    }
  }

  if (body != null) {
    options.body = body
  }
  const response = await fetch(urlObj.href, options)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  const reply = await response.json()
  return reply
}

export const paybisRampPlugin: RampPluginFactory = (
  pluginConfig: RampPluginConfig
) => {
  const initOptions = asInitOptions(pluginConfig.initOptions)
  const { account, navigation, onLogEvent, disklet } = pluginConfig

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  let state: PaybisPluginState | undefined
  const paybisPairs: PaybisPairs = { buy: undefined, sell: undefined }
  let userIdHasTransactions: boolean | undefined
  const allowedCurrencyCodes: Record<
    FiatDirection,
    Partial<Record<FiatPaymentType, FiatProviderAssetMap>>
  > = {
    buy: { credit: { providerId: pluginId, fiat: {}, crypto: {} } },
    sell: { credit: { providerId: pluginId, fiat: {}, crypto: {} } }
  }

  const initializeBuyPairs = async (): Promise<void> => {
    if (!state) throw new Error('Plugin not initialized')
    const { apiKey, partnerUrl: url } = state

    if (paybisPairs.buy == null) {
      try {
        const response = await paybisFetch({
          method: 'GET',
          url,
          path: `v2/public/currency/pairs/buy-crypto`,
          apiKey
        })
        paybisPairs.buy = asPaybisBuyPairs(response)
      } catch (e) {
        console.error(String(e))
      }
    }

    if (paybisPairs.buy != null) {
      const ccMethod = paybisPairs.buy.data.find(
        pair => pair.name === 'method-id-credit-card'
      )
      if (ccMethod != null) {
        paybisPairs.buy.data.push({
          name: 'fake-id-googlepay',
          pairs: ccMethod.pairs
        })
        paybisPairs.buy.data.push({
          name: 'fake-id-applepay',
          pairs: ccMethod.pairs
        })
      }

      for (const paymentMethodPairs of paybisPairs.buy.data) {
        const { name, pairs } = paymentMethodPairs
        if (name == null) continue
        const edgePaymentType = PAYMENT_METHOD_MAP[name]
        if (edgePaymentType == null) continue
        for (const pair of pairs) {
          const { from, to } = pair

          let paymentMethodObj = allowedCurrencyCodes.buy[edgePaymentType]
          if (paymentMethodObj == null) {
            paymentMethodObj = { providerId: pluginId, crypto: {}, fiat: {} }
            allowedCurrencyCodes.buy[edgePaymentType] = paymentMethodObj
          }
          paymentMethodObj.fiat[`iso:${from}`] = true

          for (const code of to) {
            const edgeTokenId = PAYBIS_TO_EDGE_CURRENCY_MAP[code.currencyCode]
            if (edgeTokenId != null) {
              const { pluginId: currencyPluginId } = edgeTokenId
              let tokens = paymentMethodObj.crypto[currencyPluginId]
              if (tokens == null) {
                tokens = []
                paymentMethodObj.crypto[currencyPluginId] = tokens
              }
              addTokenToArray({ tokenId: edgeTokenId.tokenId }, tokens)
            }
          }
        }
      }
    }
  }

  const initializeSellPairs = async (): Promise<void> => {
    if (!state) throw new Error('Plugin not initialized')
    const { apiKey, partnerUrl: url } = state

    if (paybisPairs.sell == null) {
      try {
        const response = await paybisFetch({
          method: 'GET',
          url,
          path: `v2/public/currency/pairs/sell-crypto`,
          apiKey
        })
        paybisPairs.sell = asPaybisSellPairs(response)
      } catch (e) {
        console.error(String(e))
      }
    }

    if (paybisPairs.sell != null) {
      for (const paymentMethodPairs of paybisPairs.sell.data) {
        const { name, pairs } = paymentMethodPairs
        if (name == null) continue
        const edgePaymentType = PAYMENT_METHOD_MAP[name]
        if (edgePaymentType == null) continue
        for (const pair of pairs) {
          const { fromAssetId, to } = pair

          let paymentMethodObj = allowedCurrencyCodes.sell[edgePaymentType]
          if (paymentMethodObj == null) {
            paymentMethodObj = { providerId: pluginId, crypto: {}, fiat: {} }
            allowedCurrencyCodes.sell[edgePaymentType] = paymentMethodObj
          }

          const edgeTokenId = PAYBIS_TO_EDGE_CURRENCY_MAP[fromAssetId]
          if (edgeTokenId == null) continue
          const { pluginId: currencyPluginId } = edgeTokenId

          let tokens = paymentMethodObj.crypto[currencyPluginId]
          if (tokens == null) {
            tokens = []
            paymentMethodObj.crypto[currencyPluginId] = tokens
          }
          addTokenToArray({ tokenId: edgeTokenId.tokenId }, tokens)

          for (const fiat of to) {
            paymentMethodObj.fiat[`iso:${fiat}`] = true
          }
        }
      }
    }
  }

  const ensureStateInitialized = async (): Promise<void> => {
    if (state == null) {
      const { apiKey, partnerUrl, privateKeyB64 } = initOptions

      let partnerUserId: string
      if (pluginConfig.store != null) {
        partnerUserId = await pluginConfig.store
          .getItem('partnerUserId')
          .catch(() => '')
        if (partnerUserId === '' && pluginConfig.makeUuid != null) {
          partnerUserId = await pluginConfig.makeUuid()
          await pluginConfig.store.setItem('partnerUserId', partnerUserId)
        } else if (partnerUserId === '') {
          partnerUserId = `edge-user-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`
          await pluginConfig.store.setItem('partnerUserId', partnerUserId)
        }
      } else {
        partnerUserId = `edge-user-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`
      }

      state = {
        apiKey,
        partnerUrl,
        privateKeyB64,
        partnerUserId
      }
    }
  }

  const ensureAssetsInitialized = async (
    direction: 'buy' | 'sell'
  ): Promise<void> => {
    await ensureStateInitialized()

    if (direction === 'buy') {
      await initializeBuyPairs()
    } else {
      await initializeSellPairs()
    }
  }

  const validateSupportRequest = (
    regionCode?: FiatPluginRegionCode,
    countryCode?: string
  ): { supported: false } | undefined => {
    // Check region restrictions
    if (regionCode != null) {
      try {
        validateRegion(pluginId, regionCode, SUPPORTED_REGIONS)
      } catch (error) {
        return { supported: false }
      }
    }

    // Check country-specific restrictions
    if (countryCode === 'GB') {
      return { supported: false }
    }

    return undefined
  }

  const checkAssetSupport = (
    direction: FiatDirection,
    fiatCurrencyCode: string,
    cryptoPluginId: string,
    tokenId?: string | null
  ): { supported: false } | undefined => {
    // Check if crypto is supported
    const paybisCc =
      EDGE_TO_PAYBIS_CURRENCY_MAP[`${cryptoPluginId}_${tokenId ?? ''}`]
    if (!paybisCc) {
      return { supported: false }
    }

    // Check if fiat/crypto pair is supported in any payment type
    const fiat = removeIsoPrefix(ensureIsoPrefix(fiatCurrencyCode))
    const pairs = paybisPairs[direction]?.data
    if (pairs == null) {
      return { supported: false }
    }

    // Check if the pair exists in any payment method
    let pairSupported = false
    for (const paymentMethodPairs of pairs) {
      if (direction === 'buy') {
        const buyPairs = paymentMethodPairs as ReturnType<
          typeof asPaymentMethodPairs
        >
        for (const pair of buyPairs.pairs) {
          if (
            pair.from === fiat &&
            pair.to.some(to => to.currencyCode === paybisCc)
          ) {
            pairSupported = true
            break
          }
        }
      } else {
        const sellPairs = paymentMethodPairs as ReturnType<
          typeof asSellPaymentMethodPairs
        >
        for (const pair of sellPairs.pairs) {
          if (pair.fromAssetId === paybisCc && pair.to.includes(fiat)) {
            pairSupported = true
            break
          }
        }
      }
      if (pairSupported) break
    }

    if (!pairSupported) {
      return { supported: false }
    }

    return undefined
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      try {
        const { direction, regionCode, fiatAsset, cryptoAsset } = request

        // Ensure assets are initialized for the direction
        await ensureAssetsInitialized(direction)

        // Validate region and country restrictions
        const regionResult = validateSupportRequest(
          regionCode,
          regionCode.countryCode
        )
        if (regionResult != null) {
          return regionResult
        }

        // Check asset support
        const assetResult = checkAssetSupport(
          direction,
          ensureIsoPrefix(fiatAsset.currencyCode),
          cryptoAsset.pluginId,
          cryptoAsset.tokenId
        )
        if (assetResult != null) {
          return assetResult
        }

        // If we get here, it's supported
        return {
          supported: true,
          supportedAmountTypes: ['fiat', 'crypto']
        }
      } catch (error) {
        // Only throw for actual errors (network issues, etc)
        // Never throw for unsupported combinations
        console.error('Paybis checkSupport error:', error)
        throw error
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      await ensureStateInitialized()
      if (!state) throw new Error('Plugin state not initialized')

      const {
        amountType,
        exchangeAmount,
        regionCode,
        pluginId: currencyPluginId,
        promoCode: maybePromoCode,
        fiatCurrencyCode,
        displayCurrencyCode,
        direction,
        tokenId
      } = request

      const isMaxAmount =
        typeof exchangeAmount === 'object' && exchangeAmount.max
      const exchangeAmountString = isMaxAmount ? '' : (exchangeAmount as string)

      // Validate region and country restrictions using helper
      const regionResult = validateSupportRequest(
        regionCode,
        regionCode.countryCode
      )
      if (regionResult != null) {
        // Return empty array for unsupported regions
        return []
      }

      // Initialize assets for the direction
      await ensureAssetsInitialized(direction)

      // Get all supported payment types for the direction
      let allPaymentTypes = Object.keys(allowedPaymentTypes[direction]).filter(
        key => allowedPaymentTypes[direction][key as FiatPaymentType] === true
      ) as FiatPaymentType[]

      // Filter out credit for sell in US
      if (direction === 'sell' && regionCode.countryCode === 'US') {
        allPaymentTypes = allPaymentTypes.filter(pt => pt !== 'credit')
      }

      if (allPaymentTypes.length === 0) {
        // Return empty array if no payment types supported
        return []
      }

      // Update user transaction status
      try {
        const response = await paybisFetch({
          method: 'GET',
          url: state.partnerUrl,
          path: `v2/public/user/${state.partnerUserId}/status`,
          apiKey: state.apiKey
        })
        const { hasTransactions } = asUserStatus(response)
        userIdHasTransactions = hasTransactions
      } catch (e) {
        console.log(`Paybis: Error getting user status: ${e}`)
      }

      const pairs = paybisPairs[direction]?.data
      if (pairs == null) {
        // Return empty array if pairs not loaded
        return []
      }

      const fiat = removeIsoPrefix(ensureIsoPrefix(fiatCurrencyCode))

      // Check asset support using helper
      const assetResult = checkAssetSupport(
        direction,
        ensureIsoPrefix(fiatCurrencyCode),
        currencyPluginId,
        tokenId
      )
      if (assetResult != null) {
        // Return empty array for unsupported asset pairs
        return []
      }

      const paybisCc =
        EDGE_TO_PAYBIS_CURRENCY_MAP[`${currencyPluginId}_${tokenId ?? ''}`]

      // Create array to store all quotes
      const quotes: RampQuoteResult[] = []

      // Get quote for each supported payment type
      for (const paymentType of allPaymentTypes) {
        try {
          const paymentMethod =
            direction === 'buy'
              ? REVERSE_PAYMENT_METHOD_MAP[paymentType]
              : SELL_REVERSE_PAYMENT_METHOD_MAP[paymentType]

          if (paymentMethod == null) continue // Skip unsupported payment types

          let currencyCodeFrom
          let currencyCodeTo
          let directionChange: 'from' | 'to'
          let amount

          if (isMaxAmount) {
            const cacheKey = getCacheKey(
              direction,
              fiat,
              paybisCc,
              amountType,
              paymentMethod
            )
            const cached = maxAmountCache.get(cacheKey)
            const now = Date.now()

            if (cached && now - cached.timestamp < MAX_CACHE_TTL) {
              amount = cached.amount
            } else {
              // Use default max amounts
              amount = amountType === 'fiat' ? '10000' : '10'
              // Cache the result
              maxAmountCache.set(cacheKey, {
                amount,
                timestamp: now
              })
            }
          } else {
            amount = exchangeAmountString
          }

          if (direction === 'buy') {
            currencyCodeFrom = fiat
            currencyCodeTo = paybisCc
            if (amountType === 'fiat') {
              directionChange = 'from'
              amount = isMaxAmount ? amount : round(amount, FIAT_DECIMALS)
            } else {
              directionChange = 'to'
              amount = isMaxAmount ? amount : round(amount, CRYPTO_DECIMALS)
            }
          } else {
            currencyCodeFrom = paybisCc
            currencyCodeTo = fiat
            if (amountType === 'fiat') {
              amount = isMaxAmount ? amount : round(amount, FIAT_DECIMALS)
              directionChange = 'to'
            } else {
              amount = isMaxAmount ? amount : round(amount, CRYPTO_DECIMALS)
              directionChange = 'from'
            }
          }

          const bodyParams = {
            currencyCodeFrom,
            amount,
            currencyCodeTo,
            directionChange,
            isReceivedAmount: directionChange === 'to',
            paymentMethod: direction === 'buy' ? paymentMethod : undefined,
            payoutMethod: direction === 'sell' ? paymentMethod : undefined
          }

          let promoCode: string | undefined
          if (maybePromoCode != null && !isMaxAmount) {
            let amountUsd: string
            const convertFromCc =
              amountType === 'fiat' ? fiatCurrencyCode : displayCurrencyCode
            if (convertFromCc === 'iso:USD') {
              amountUsd = exchangeAmountString
            } else {
              // For now, always return 1 (matching old implementation)
              // TODO: Implement actual rate fetching if needed
              const rate = 1
              amountUsd = mul(exchangeAmountString, String(rate))
            }
            if (lte(amountUsd, '1000')) {
              if (userIdHasTransactions === false) {
                promoCode = maybePromoCode
              }
            }
          }

          if (!state) throw new Error('Plugin not initialized')
          const response = await paybisFetch({
            method: 'POST',
            url: state.partnerUrl,
            path: 'v2/public/quote',
            apiKey: state.apiKey,
            bodyParams,
            promoCode
          })

          const {
            id: quoteId,
            paymentMethods,
            paymentMethodErrors,
            payoutMethods,
            payoutMethodErrors
          } = asQuote(response)

          const pmErrors = paymentMethodErrors ?? payoutMethodErrors
          if (pmErrors != null) {
            // Skip this payment type if there are errors
            console.warn(`Paybis: Quote error for ${paymentType}:`, pmErrors)
            continue
          }

          let pmQuote
          if (direction === 'buy' && paymentMethods?.length === 1) {
            pmQuote = paymentMethods[0]
          } else if (direction === 'sell' && payoutMethods?.length === 1) {
            pmQuote = payoutMethods[0]
          } else {
            console.warn(
              `Paybis: Invalid number of quoted payment methods for ${paymentType}`
            )
            continue
          }

          const { id: paymentMethodId, amountFrom, amountTo } = pmQuote

          let cryptoAmount: string
          let fiatAmount: string

          if (directionChange === 'from') {
            assert(
              eq(amount, amountFrom.amount),
              'Quote not equal to requested from amount'
            )
          } else {
            assert(
              eq(amount, amountTo.amount),
              'Quote not equal to requested to amount'
            )
          }

          if (direction === 'buy') {
            fiatAmount = amountFrom.amount
            cryptoAmount = amountTo.amount
          } else {
            fiatAmount = amountTo.amount
            cryptoAmount = amountFrom.amount
          }

          // Store promoCode for use in approveQuote
          const quotePromoCode = promoCode

          const quote: RampQuoteResult = {
            pluginId,
            partnerIcon,
            pluginDisplayName: 'Paybis',
            displayCurrencyCode,
            cryptoAmount,
            isEstimate: false,
            fiatCurrencyCode,
            fiatAmount,
            direction,
            regionCode,
            paymentType,
            expirationDate: new Date(Date.now() + 60000),
            settlementRange: {
              min: { value: 5, unit: 'minutes' },
              max: { value: 24, unit: 'hours' }
            },
            approveQuote: async (
              approveParams: RampApproveQuoteParams
            ): Promise<void> => {
              const { coreWallet } = approveParams
              const deniedPermission = await requestPermissionOnSettings(
                disklet,
                'camera',
                pluginDisplayName,
                true
              )
              if (deniedPermission) {
                showToast(
                  lstrings.fiat_plugin_cannot_continue_camera_permission
                )
                return
              }
              const receiveAddress = await coreWallet.getReceiveAddress({
                tokenId: null
              })

              let bodyParams
              if (direction === 'buy') {
                bodyParams = {
                  cryptoWalletAddress: {
                    currencyCode: paybisCc,
                    address:
                      receiveAddress.segwitAddress ??
                      receiveAddress.publicAddress
                  },
                  partnerUserId: state!.partnerUserId,
                  locale: locale.localeIdentifier.slice(0, 2),
                  passwordless: true,
                  trustedKyc: false,
                  quoteId,
                  flow: 'buyCrypto',
                  paymentMethod: paymentMethodId
                }
              } else {
                bodyParams = {
                  cryptoPaymentMethod: 'partner_controlled_with_redirect',
                  partnerUserId: state!.partnerUserId,
                  locale: locale.localeIdentifier.slice(0, 2),
                  passwordless: true,
                  trustedKyc: false,
                  quoteId,
                  flow: 'sellCrypto',
                  depositCallbackUrl: RETURN_URL_PAYMENT,
                  paymentMethod: paymentMethodId
                }
              }

              const privateKey = atob(state!.privateKeyB64)
              const promise = paybisFetch({
                method: 'POST',
                url: state!.partnerUrl,
                path: 'v2/public/request',
                apiKey: state!.apiKey,
                bodyParams,
                promoCode: quotePromoCode,
                privateKey
              })
              const response = await showToastSpinner(
                lstrings.fiat_plugin_finalizing_quote,
                promise
              )
              const { oneTimeToken, requestId } =
                asPublicRequestResponse(response)

              const widgetUrl = isWalletTestnet(coreWallet)
                ? WIDGET_URL_SANDBOX
                : WIDGET_URL

              const ott =
                oneTimeToken != null ? `&oneTimeToken=${oneTimeToken}` : ''
              const promoCodeParam =
                quotePromoCode != null ? `&promoCode=${quotePromoCode}` : ''

              if (direction === 'buy') {
                const successReturnURL = encodeURIComponent(
                  'https://return.edge.app/fiatprovider/buy/paybis?transactionStatus=success'
                )
                const failureReturnURL = encodeURIComponent(
                  'https://return.edge.app/fiatprovider/buy/paybis?transactionStatus=fail'
                )

                // Register deeplink handler
                rampDeeplinkManager.register(
                  direction,
                  pluginId,
                  async (link: FiatProviderLink) => {
                    const { query, uri } = link
                    console.log('Paybis WebView launch buy success: ' + uri)
                    const { transactionStatus } = query
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
                          orderId: requestId
                        }
                      })
                      const message =
                        sprintf(
                          lstrings.fiat_plugin_buy_complete_message_s,
                          cryptoAmount,
                          displayCurrencyCode,
                          fiatAmount,
                          fiat,
                          '1'
                        ) +
                        '\n\n' +
                        sprintf(
                          lstrings.fiat_plugin_buy_complete_message_2_hour_s,
                          '1'
                        ) +
                        '\n\n' +
                        lstrings.fiat_plugin_sell_complete_message_3

                      // Show success modal
                      await showButtonsModal({
                        buttons: {
                          ok: { label: lstrings.string_ok }
                        },
                        title: lstrings.fiat_plugin_buy_complete_title,
                        message
                      })
                    } else if (transactionStatus === 'failure') {
                      showToast(
                        lstrings.fiat_plugin_buy_failed_try_again,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                    } else {
                      showError(
                        new Error(
                          `Paybis: Invalid transactionStatus "${transactionStatus}".`
                        )
                      )
                    }
                  }
                )

                // Open external webview
                const url = `${widgetUrl}?requestId=${requestId}${ott}${promoCodeParam}&successReturnURL=${successReturnURL}&failureReturnURL=${failureReturnURL}`
                if (Platform.OS === 'ios') {
                  await SafariView.show({ url })
                } else {
                  await CustomTabs.openURL(url)
                }

                return
              }

              const successReturnURL = encodeURIComponent(RETURN_URL_SUCCESS)
              const failureReturnURL = encodeURIComponent(RETURN_URL_FAIL)
              const webviewUrl = `${widgetUrl}?requestId=${requestId}&successReturnURL=${successReturnURL}&failureReturnURL=${failureReturnURL}${ott}${promoCodeParam}`
              console.log(`webviewUrl: ${webviewUrl}`)
              let inPayment = false

              const openWebView = async () => {
                navigation.navigate('guiPluginWebView', {
                  url: webviewUrl,
                  onUrlChange: async (newUrl: string) => {
                    console.log(`*** onUrlChange: ${newUrl}`)
                    if (newUrl.startsWith(RETURN_URL_FAIL)) {
                      navigation.pop()
                      showToast(
                        lstrings.fiat_plugin_sell_failed_try_again,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                    } else if (newUrl.startsWith(RETURN_URL_PAYMENT)) {
                      if (inPayment) return
                      inPayment = true
                      try {
                        const payDetails = await paybisFetch({
                          method: 'GET',
                          url: state!.partnerUrl,
                          path: `v2/request/${requestId}/payment-details`,
                          apiKey: state!.apiKey,
                          promoCode: quotePromoCode
                        })
                        const {
                          assetId,
                          amount,
                          currencyCode: pbCurrencyCode,
                          network,
                          depositAddress,
                          destinationTag
                        } = asPaymentDetails(payDetails)
                        const { pluginId, tokenId } =
                          PAYBIS_TO_EDGE_CURRENCY_MAP[assetId]

                        console.log(`Creating Paybis payment`)
                        console.log(`  amount: ${amount}`)
                        console.log(`  assetId: ${assetId}`)
                        console.log(`  pbCurrencyCode: ${pbCurrencyCode}`)
                        console.log(`  network: ${network}`)
                        console.log(`  pluginId: ${pluginId}`)
                        console.log(`  tokenId: ${tokenId}`)
                        const nativeAmount = mul(
                          amount,
                          getCurrencyCodeMultiplier(
                            coreWallet.currencyConfig,
                            displayCurrencyCode
                          )
                        )

                        const assetAction: EdgeAssetAction = {
                          assetActionType: 'sell'
                        }
                        const savedAction: EdgeTxActionFiat = {
                          actionType: 'fiat',
                          orderId: requestId,
                          orderUri: `${widgetUrl}?requestId=${requestId}`,
                          isEstimate: true,
                          fiatPlugin: {
                            providerId: pluginId,
                            providerDisplayName,
                            supportEmail
                          },
                          payinAddress: depositAddress,
                          cryptoAsset: {
                            pluginId: coreWallet.currencyInfo.pluginId,
                            tokenId,
                            nativeAmount
                          },
                          fiatAsset: {
                            fiatCurrencyCode,
                            fiatAmount
                          }
                        }

                        const spendInfo: EdgeSpendInfo = {
                          tokenId,
                          assetAction,
                          savedAction,
                          spendTargets: [
                            {
                              nativeAmount,
                              publicAddress: depositAddress
                            }
                          ]
                        }

                        if (destinationTag != null) {
                          spendInfo.memos = [
                            {
                              type: 'text',
                              value: destinationTag,
                              hidden: true
                            }
                          ]
                        }

                        const sendParams: SendScene2Params = {
                          walletId: coreWallet.id,
                          tokenId,
                          spendInfo,
                          lockTilesMap: {
                            address: true,
                            amount: true,
                            wallet: true
                          },
                          hiddenFeaturesMap: {
                            address: true
                          }
                        }
                        // Navigate to send scene
                        const tx = await new Promise<EdgeTransaction>(
                          (resolve, reject) => {
                            navigation.navigate('send2', {
                              ...sendParams,
                              onDone: (
                                error: Error | null,
                                edgeTransaction?: EdgeTransaction
                              ) => {
                                if (error != null) {
                                  reject(error)
                                } else if (edgeTransaction != null) {
                                  resolve(edgeTransaction)
                                } else {
                                  reject(new Error(SendErrorNoTransaction))
                                }
                              },
                              onBack: () => {
                                reject(new Error(SendErrorBackPressed))
                              }
                            })
                          }
                        )

                        // Track conversion
                        onLogEvent('Sell_Success', {
                          conversionValues: {
                            conversionType: 'sell',
                            destFiatCurrencyCode: fiatCurrencyCode,
                            destFiatAmount: fiatAmount,
                            sourceAmount: new CryptoAmount({
                              currencyConfig: coreWallet.currencyConfig,
                              currencyCode: displayCurrencyCode,
                              exchangeAmount: amount
                            }),
                            fiatProviderId: pluginId,
                            orderId: requestId
                          }
                        })

                        if (tokenId != null) {
                          const params: SaveTxActionParams = {
                            walletId: coreWallet.id,
                            tokenId,
                            txid: tx.txid,
                            savedAction,
                            assetAction: {
                              ...assetAction,
                              assetActionType: 'sell'
                            }
                          }
                          await account.currencyWallets[
                            coreWallet.id
                          ].saveTxAction(params)
                        }

                        navigation.pop()
                        await openWebView()
                      } catch (e: unknown) {
                        navigation.pop()
                        await openWebView()
                        if (
                          e instanceof Error &&
                          e.message === SendErrorNoTransaction
                        ) {
                          showToast(
                            lstrings.fiat_plugin_sell_failed_to_send_try_again,
                            NOT_SUCCESS_TOAST_HIDE_MS
                          )
                        } else if (
                          e instanceof Error &&
                          e.message === SendErrorBackPressed
                        ) {
                          // Do nothing
                        } else {
                          showError(e)
                        }
                      } finally {
                        inPayment = false
                      }
                    }
                  }
                })
              }
              await openWebView()
            },
            closeQuote: async () => {}
          }

          quotes.push(quote)
        } catch (error) {
          console.warn(`Paybis: Failed to get quote for ${paymentType}:`, error)
          // Continue with other payment types
        }
      }

      // Return the quotes array (empty if no quotes found)
      return quotes
    }
  }

  return plugin
}
