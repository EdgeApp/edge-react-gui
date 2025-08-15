import { gt, lt, mul, toFixed } from 'biggystring'
import {
  asArray,
  asEither,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import { showError } from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import type { HomeAddress, SepaInfo } from '../../../types/FormTypes'
import type { StringMap } from '../../../types/types'
import {
  getCurrencyCodeMultiplier,
  getTokenId
} from '../../../util/CurrencyInfoHelpers'
import { utf8 } from '../../../util/encoding'
import { removeIsoPrefix } from '../../../util/utils'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import type {
  FiatDirection,
  FiatPaymentType,
  FiatPluginRegionCode
} from '../../gui/fiatPluginTypes'
import type {
  FiatProviderAssetMap,
  ProviderToken
} from '../../gui/fiatProviderTypes'
import { addTokenToArray } from '../../gui/util/providerUtils'
import type {
  RampApproveQuoteParams,
  RampCheckSupportRequest,
  RampInfo,
  RampPlugin,
  RampPluginConfig,
  RampQuoteRequest,
  RampQuoteResult,
  RampSupportResult
} from '../rampPluginTypes'
import { asInitOptions } from './bityRampTypes'

const pluginId = 'bity'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/logoBity.png`
const pluginDisplayName = 'Bity'
const providerDisplayName = pluginDisplayName
const supportEmail = 'support_edge@bity.com'
const supportedPaymentType: FiatPaymentType = 'sepa'
const partnerFee = 0.005

// Default Edge client ID for backward compatibility
const EDGE_CLIENT_ID = '4949bf59-c23c-4d71-949e-f5fd56ff815b'

// Cache for max amounts with 2 minute TTL
const maxAmountCache = new Map<string, { amount: string; timestamp: number }>()
const MAX_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

const getCacheKey = (
  direction: FiatDirection,
  fiatCode: string,
  cryptoCode: string,
  amountType: 'fiat' | 'crypto'
): string => {
  return `${direction}-${fiatCode}-${cryptoCode}-${amountType}`
}

const noKycCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = {
  buy: {
    providerId: pluginId,
    fiat: {},
    crypto: {
      bitcoin: [{ tokenId: null }],
      ethereum: [{ tokenId: null }],
      litecoin: [{ tokenId: null }]
    }
  },
  sell: {
    providerId: pluginId,
    fiat: {},
    crypto: {
      bitcoin: [{ tokenId: null }],
      // Add USDT and USDC for no-KYC sell
      ethereum: [
        { tokenId: null },
        { tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
        { tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
      ]
    }
  }
}

const supportedRegionCodes = [
  'AT',
  'BE',
  'BG',
  'CH',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE', // Ireland
  'IT',
  'LV',
  'LT',
  'LU',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'HR',
  'LI',
  'NO',
  'SM',
  'GB'
]

const CURRENCY_PLUGINID_MAP: StringMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin',
  USDC: 'ethereum',
  USDT: 'ethereum'
}

const asBityCurrencyTag = asValue('crypto', 'erc20', 'ethereum', 'fiat')
const asBityCurrency = asObject({
  tags: asArray(asBityCurrencyTag),
  code: asString,
  max_digits_in_decimal_part: asNumber
})
const asBityCurrencyResponse = asObject({ currencies: asArray(asBityCurrency) })

const asBityError = asObject({ code: asString, message: asString })
const asBityErrorResponse = asObject({ errors: asArray(asBityError) })

// Main cleaner for the input object
const asInputObject = asObject({
  amount: asString,
  currency: asString,
  minimum_amount: asOptional(asString)
})

// Main cleaner for the output object
const asOutputObject = asObject({
  amount: asString,
  currency: asString,
  minimum_amount: asOptional(asString)
})

// Complete data cleaner
const asBityQuote = asObject({
  input: asInputObject,
  output: asOutputObject
})

export type BityCurrency = ReturnType<typeof asBityCurrency>
export type BityCurrencyTag = ReturnType<typeof asBityCurrencyTag>

interface BityQuoteRequest {
  input: {
    amount?: string
    currency: string
  }
  output: {
    amount?: string
    currency: string
  }
}

interface BityBuyOrderRequest {
  client_value: number
  input: {
    amount: string
    currency: string
    type: 'bank_account'
    iban: string
    bic_swift: string
  }
  output: {
    currency: string
    type: 'crypto_address'
    crypto_address: string
  }
  partner_fee: { factor: number }
}

interface BitySellOrderRequest {
  client_value: number
  input: {
    amount: string
    currency: string
    type: 'crypto_address'
    crypto_address: string
  }
  output: {
    currency: string
    type: 'bank_account'
    iban: string
    bic_swift: string
    owner: {
      name: string
      street_name: string
      building_number: string
      town_name: string
      country: string
      country_subdivision: string
      post_code: string
    }
  }
  partner_fee: { factor: number }
}

const asBitySellApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asString
  }),
  output: asObject({
    amount: asString,
    currency: asString
  }),
  payment_details: asObject({
    crypto_address: asString,
    type: asValue('crypto_address')
  })
})

const asBityBuyApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString
  }),
  output: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asString
  }),
  payment_details: asObject({
    iban: asString,
    swift_bic: asString,
    reference: asString,
    recipient_name: asString,
    recipient: asString
  })
})

const asBityApproveQuoteResponse = asEither(
  asBityBuyApproveQuoteResponse,
  asBitySellApproveQuoteResponse
)

type BityApproveQuoteResponse = ReturnType<typeof asBityApproveQuoteResponse>

class BityError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

/**
 * Ensures that a fiat currency code has the 'iso:' prefix.
 * If the code already has the prefix, it returns the code unchanged.
 * Otherwise, it adds the 'iso:' prefix.
 */
const ensureIsoPrefix = (currencyCode: string): string => {
  return currencyCode.startsWith('iso:') ? currencyCode : `iso:${currencyCode}`
}

// Provider configuration cache
interface BityConfigCache {
  data: {
    currencies: BityCurrency[]
  } | null
  timestamp: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
let configCache: BityConfigCache = { data: null, timestamp: 0 }

// Supported assets cache
interface SupportedAssetsCache {
  fiat: Set<string>
  crypto: Map<string, ProviderToken[]>
}

const supportedAssetsCache: SupportedAssetsCache = {
  fiat: new Set(),
  crypto: new Map()
}

const fetchBityQuote = async (
  bodyData: BityQuoteRequest,
  apiUrl: string
): Promise<any> => {
  const request = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  }
  const result = await fetch(`${apiUrl}/v2/orders/estimate`, request)
  if (result.ok) {
    const newData = await result.json()
    return newData
  } else {
    let bityErrorRes
    try {
      bityErrorRes = asBityErrorResponse(await result.json())
    } catch (e) {
      throw new Error('Bity: Unable to fetch quote: ' + (await result.text()))
    }
    if (
      bityErrorRes.errors.some(
        bityError => bityError.code === 'amount_too_large'
      )
    ) {
      throw new Error('Bity: Amount too large')
    }
    throw new Error('Bity: ' + bityErrorRes.errors[0].message)
  }
}

const approveBityQuote = async (
  wallet: EdgeCurrencyWallet,
  data: BityBuyOrderRequest | BitySellOrderRequest,
  clientId: string,
  apiUrl: string
): Promise<BityApproveQuoteResponse> => {
  const baseUrl = apiUrl
  const orderUrl = `${apiUrl}/v2/orders`
  const orderReq: RequestInit = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-Id': clientId
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }

  const orderRes = await fetch(orderUrl, orderReq)

  if (orderRes.status !== 201) {
    const errorData = await orderRes.json()
    throw new BityError(errorData.errors[0].message, errorData.errors[0].code)
  }
  // "location": "https://...bity.com/v2/orders/[orderid]"
  const locationHeader = orderRes.headers.get('Location')

  const locationUrl = baseUrl + locationHeader
  const locationReq: RequestInit = {
    method: 'GET',
    credentials: 'include'
  }
  const locationRes = await fetch(locationUrl, locationReq)

  if (locationRes.status !== 200) {
    console.error(JSON.stringify({ locationRes }, null, 2))
    throw new Error('Problem confirming order: Code n200')
  }
  const orderData = await locationRes.json()

  if (orderData.message_to_sign != null) {
    const { body } = orderData.message_to_sign
    const { publicAddress } = await wallet.getReceiveAddress({ tokenId: null })
    const signedMessage = isUtxoWallet(wallet)
      ? await wallet.signMessage(body, { otherParams: { publicAddress } })
      : await wallet.signBytes(utf8.parse(body), {
          otherParams: { publicAddress }
        })
    const signUrl = baseUrl + orderData.message_to_sign.signature_submission_url
    const request = {
      method: 'POST',
      headers: {
        Host: 'exchange.api.bity.com',
        'Content-Type': '*/*'
      },
      body: signedMessage
    }
    const signedTransactionResponse = await fetch(signUrl, request)
    if (signedTransactionResponse.status === 400) {
      throw new Error('Could not complete transaction. Code: 400')
    }
    if (signedTransactionResponse.status === 204) {
      const bankDetailsReq = {
        method: 'GET',
        credentials: 'include'
      }
      const detailUrl = orderUrl + '/' + orderData.id
      // @ts-expect-error - fetch type mismatch with bankDetailsReq
      const bankDetailRes = await fetch(detailUrl, bankDetailsReq)
      if (bankDetailRes.status === 200) {
        const bankDetailResJson = await bankDetailRes.json()
        return asBityApproveQuoteResponse(bankDetailResJson)
      }
    }
  }
  return asBityApproveQuoteResponse(orderData)
}

async function fetchProviderConfig(
  account: EdgeAccount,
  apiUrl: string
): Promise<{ currencies: BityCurrency[] }> {
  const now = Date.now()

  // Check if cache is valid
  if (configCache.data != null && now - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.data
  }

  // Fetch fresh configuration
  const response = await fetch(`${apiUrl}/v2/currencies`).catch(
    (_e: unknown) => undefined
  )

  if (response?.ok !== true) {
    console.error(
      `Bity fetchProviderConfig response error: ${await response?.text()}`
    )
    // Return cached data if available, even if expired
    if (configCache.data != null) return configCache.data
    throw new Error('Failed to fetch Bity currencies')
  }

  const result = await response.json()
  let bityCurrencies: BityCurrency[] = []
  try {
    bityCurrencies = asBityCurrencyResponse(result).currencies
  } catch (error) {
    console.error(error)
    // Return cached data if available, even if expired
    if (configCache.data != null) return configCache.data
    throw new Error('Failed to parse Bity currencies')
  }

  // Update supported assets cache
  supportedAssetsCache.fiat.clear()
  supportedAssetsCache.crypto.clear()

  for (const currency of bityCurrencies) {
    if (currency.tags.length === 1 && currency.tags[0] === 'fiat') {
      const fiatCurrencyCode = 'iso:' + currency.code.toUpperCase()
      supportedAssetsCache.fiat.add(fiatCurrencyCode)
    } else if (currency.tags.includes('crypto')) {
      // Bity reports cryptos with a set of multiple tags such that there is
      // overlap, such as USDC being 'crypto', 'ethereum', 'erc20'.
      const pluginId =
        currency.tags.includes('erc20') && currency.tags.includes('ethereum')
          ? 'ethereum'
          : CURRENCY_PLUGINID_MAP[currency.code]
      if (pluginId == null) continue

      // Map Bity currency code to tokenId using dynamic resolution
      let tokenId: EdgeTokenId = null
      const currencyConfig = account.currencyConfig[pluginId]
      if (currencyConfig != null) {
        const resolvedTokenId = getTokenId(currencyConfig, currency.code)
        if (resolvedTokenId !== undefined) {
          tokenId = resolvedTokenId
        }
      }

      // Skip if we couldn't resolve the token ID for ERC20 tokens
      if (currency.tags.includes('erc20') && tokenId === null) {
        continue
      }

      // Check if in no-KYC list
      const buyList = noKycCurrencyCodes.buy.crypto[pluginId]
      const sellList = noKycCurrencyCodes.sell.crypto[pluginId]
      const isInBuyList = buyList?.some(t => t.tokenId === tokenId)
      const isInSellList = sellList?.some(t => t.tokenId === tokenId)

      if (!isInBuyList && !isInSellList) {
        continue
      }

      // Add to crypto cache
      const tokens = supportedAssetsCache.crypto.get(pluginId) ?? []
      addTokenToArray({ tokenId }, tokens)
      supportedAssetsCache.crypto.set(pluginId, tokens)
    }
  }

  // Update cache
  const data = { currencies: bityCurrencies }
  configCache = {
    data,
    timestamp: now
  }

  return data
}

function isUtxoWallet(wallet: EdgeCurrencyWallet): boolean {
  return [
    'wallet:badcoin',
    'wallet:bitcoin',
    'wallet:bitcoincash',
    'wallet:bitcoincashtestnet',
    'wallet:bitcoingold',
    'wallet:bitcoingoldtestnet',
    'wallet:bitcoinsv',
    'wallet:bitcointestnet',
    'wallet:bitcointestnet4',
    'wallet:dash',
    'wallet:digibyte',
    'wallet:dogecoin',
    'wallet:eboost',
    'wallet:feathercoin',
    'wallet:groestlcoin',
    'wallet:litecoin',
    'wallet:qtum',
    'wallet:ravencoin',
    'wallet:smartcash',
    'wallet:ufo',
    'wallet:vertcoin',
    'wallet:zcoin'
  ].includes(wallet.currencyInfo.walletType)
}

/**
 * Check if a region is supported by checking if the country code is in supportedRegionCodes.
 * Supports both country-only format (e.g., "US") and country:state format (e.g., "US:CA").
 */
function isRegionSupported(regionCode: FiatPluginRegionCode): boolean {
  // Extract country code from the regionCode
  // Handle both "US" and "US:CA" formats
  const countryCode = regionCode.countryCode.includes(':')
    ? regionCode.countryCode.split(':')[0]
    : regionCode.countryCode

  // Check if the country is supported
  return supportedRegionCodes.includes(countryCode)
}

/**
 * Check if a crypto asset is supported in the noKycCurrencyCodes list
 */
function isCryptoSupported(
  pluginId: string,
  tokenId: EdgeTokenId,
  direction: 'buy' | 'sell'
): boolean {
  const cryptoList = noKycCurrencyCodes[direction].crypto[pluginId]
  return cryptoList?.some(t => t.tokenId === tokenId) ?? false
}

/**
 * Find matching crypto currency in provider's currency list
 */
function findCryptoCurrency(
  currencies: BityCurrency[],
  pluginId: string,
  tokenId: EdgeTokenId,
  account: EdgeAccount
): BityCurrency | undefined {
  for (const currency of currencies) {
    if (currency.tags.includes('crypto')) {
      const mappedPluginId =
        currency.tags.includes('erc20') && currency.tags.includes('ethereum')
          ? 'ethereum'
          : CURRENCY_PLUGINID_MAP[currency.code]

      if (mappedPluginId === pluginId) {
        // Check tokenId match
        if (tokenId === null && !currency.tags.includes('erc20')) {
          return currency
        } else if (tokenId !== null && currency.tags.includes('erc20')) {
          // For ERC20 tokens, use dynamic resolution to match
          const currencyConfig = account.currencyConfig[pluginId]
          if (currencyConfig != null) {
            const resolvedTokenId = getTokenId(currencyConfig, currency.code)
            if (resolvedTokenId === tokenId) {
              return currency
            }
          }
        }
      }
    }
  }
  return undefined
}

/**
 * Find matching fiat currency in provider's currency list
 */
function findFiatCurrency(
  currencies: BityCurrency[],
  fiatCode: string
): BityCurrency | undefined {
  return currencies.find(
    currency =>
      currency.tags.length === 1 &&
      currency.tags[0] === 'fiat' &&
      currency.code === fiatCode
  )
}

export const bityRampPlugin = (pluginConfig: RampPluginConfig): RampPlugin => {
  const initOptions = asInitOptions(pluginConfig.initOptions)
  // Use fallback client ID if not provided in configuration
  const clientId = initOptions.clientId ?? EDGE_CLIENT_ID
  const apiUrl = initOptions.apiUrl
  const { account, navigation, onLogEvent } = pluginConfig

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      try {
        const { direction, regionCode, fiatAsset, cryptoAsset } = request

        // Quick local check: region support
        if (!isRegionSupported(regionCode)) {
          return { supported: false }
        }

        // Quick local check: crypto support in no-KYC list
        if (
          !isCryptoSupported(
            cryptoAsset.pluginId,
            cryptoAsset.tokenId,
            direction
          )
        ) {
          return { supported: false }
        }

        // Need to fetch provider config to check fiat support
        let providerConfig
        try {
          providerConfig = await fetchProviderConfig(account, apiUrl)
        } catch (error) {
          // Log error but return false instead of throwing
          console.error(
            'Bity checkSupport: Failed to fetch provider config:',
            error
          )
          return { supported: false }
        }

        // Check if fiat currency is supported
        const fiatCode = removeIsoPrefix(
          ensureIsoPrefix(fiatAsset.currencyCode)
        )
        const fiatCurrency = findFiatCurrency(
          providerConfig.currencies,
          fiatCode
        )

        if (fiatCurrency == null) {
          return { supported: false }
        }

        // All checks passed
        return { supported: true }
      } catch (error) {
        // Log error and return false for any unexpected errors
        console.error('Bity checkSupport error:', error)
        return { supported: false }
      }
    },

    fetchQuote: async (
      request: RampQuoteRequest
    ): Promise<RampQuoteResult[]> => {
      const {
        amountType,
        direction,
        exchangeAmount,
        fiatCurrencyCode,
        regionCode,
        pluginId: currencyPluginId,
        tokenId,
        displayCurrencyCode
      } = request
      const isBuy = direction === 'buy'

      const isMaxAmount =
        typeof exchangeAmount === 'object' && exchangeAmount.max
      const exchangeAmountString = isMaxAmount ? '' : (exchangeAmount as string)

      // Validate region using helper function
      if (!isRegionSupported(regionCode)) {
        console.error('Bity fetchQuote error: Region not supported', {
          regionCode
        })
        return []
      }

      // Validate crypto using helper function
      if (!isCryptoSupported(currencyPluginId, tokenId, direction)) {
        console.error('Bity fetchQuote error: Crypto not supported', {
          currencyPluginId,
          tokenId,
          direction
        })
        return []
      }

      // Get provider configuration (cached)
      let providerConfig
      try {
        providerConfig = await fetchProviderConfig(account, apiUrl)
      } catch (error) {
        // Return empty array for provider config failures
        console.error(
          'Bity fetchQuote error: Failed to fetch provider config',
          error
        )
        return []
      }

      // Find the crypto currency in Bity's supported list
      const cryptoCurrencyObj = findCryptoCurrency(
        providerConfig.currencies,
        currencyPluginId,
        tokenId,
        account
      )
      const cryptoCode = cryptoCurrencyObj?.code

      if (cryptoCurrencyObj == null || cryptoCode == null) {
        // Crypto not found in provider's list
        console.error(
          'Bity fetchQuote error: Crypto currency not found in provider list',
          { currencyPluginId, tokenId }
        )
        return []
      }

      // Find the fiat currency
      const fiatCode = removeIsoPrefix(ensureIsoPrefix(fiatCurrencyCode))
      const fiatCurrencyObj = findFiatCurrency(
        providerConfig.currencies,
        fiatCode
      )

      if (fiatCurrencyObj == null) {
        // Fiat not supported
        console.error('Bity fetchQuote error: Fiat currency not supported', {
          fiatCode
        })
        return []
      }

      const inputCurrencyCode = isBuy ? fiatCode : cryptoCode
      const outputCurrencyCode = isBuy ? cryptoCode : fiatCode

      const amountPrecision =
        amountType === 'fiat'
          ? fiatCurrencyObj.max_digits_in_decimal_part
          : cryptoCurrencyObj.max_digits_in_decimal_part

      let amount = ''
      if (isMaxAmount) {
        const cacheKey = getCacheKey(
          direction,
          fiatCode,
          cryptoCode,
          amountType
        )
        const cached = maxAmountCache.get(cacheKey)
        const now = Date.now()

        if (cached != null && now - cached.timestamp < MAX_CACHE_TTL) {
          amount = cached.amount
        } else {
          // Use 1000 as max fiat (their no-KYC limit)
          if (amountType === 'fiat') {
            amount = '1000'
          } else {
            // For crypto, fetch a quote with 1000 fiat to get crypto amount
            const maxFiatRequest: BityQuoteRequest = {
              input: {
                amount: isBuy ? '1000' : undefined,
                currency: isBuy ? fiatCode : cryptoCode
              },
              output: {
                amount: isBuy ? undefined : '1000',
                currency: isBuy ? cryptoCode : fiatCode
              }
            }
            try {
              const maxRaw = await fetchBityQuote(maxFiatRequest, apiUrl)
              const maxQuote = asBityQuote(maxRaw)
              amount = isBuy ? maxQuote.output.amount : maxQuote.input.amount
            } catch (error) {
              console.error(
                'Bity fetchQuote error: Failed to fetch max quote',
                error
              )
              return []
            }
          }
          // Cache the result
          maxAmountCache.set(cacheKey, {
            amount,
            timestamp: now
          })
        }
      } else {
        amount = toFixed(exchangeAmountString, amountPrecision)
      }
      const isReverseQuote =
        (isBuy && amountType === 'crypto') || (!isBuy && amountType === 'fiat')
      const quoteRequest: BityQuoteRequest = {
        input: {
          amount: isReverseQuote ? undefined : amount,
          currency: inputCurrencyCode
        },
        output: {
          amount: isReverseQuote ? amount : undefined,
          currency: outputCurrencyCode
        }
      }

      let bityQuote: ReturnType<typeof asBityQuote>
      try {
        const raw = await fetchBityQuote(quoteRequest, apiUrl)
        bityQuote = asBityQuote(raw)
        console.log('Got Bity quote:\n', JSON.stringify(bityQuote, null, 2))
      } catch (error) {
        // Return empty array for quote fetching failures
        console.error('Bity fetchQuote error: Failed to fetch quote', {
          quoteRequest,
          error
        })
        return []
      }

      const minimumAmount = isReverseQuote
        ? bityQuote.output.minimum_amount
        : bityQuote.input.minimum_amount
      if (minimumAmount != null && lt(amount, minimumAmount)) {
        // Under minimum
        console.error('Bity fetchQuote error: Amount under minimum', {
          amount,
          minimumAmount
        })
        return []
      }

      // Because Bity only supports <=1k transactions w/o KYC and we have no
      // way to KYC a user, add a 1k limit
      if (!isMaxAmount) {
        if (amountType === 'fiat') {
          if (gt(exchangeAmountString, '1000')) {
            // Over limit
            console.error(
              'Bity fetchQuote error: Fiat amount exceeds 1000 limit',
              { exchangeAmount: exchangeAmountString }
            )
            return []
          }
        } else {
          // User entered a crypto amount. Get the crypto amount for 1k fiat
          // so we can compare crypto amounts.
          const kRequest: BityQuoteRequest = {
            input: {
              amount: isBuy ? '1000' : undefined,
              currency: isBuy ? fiatCode : cryptoCode
            },
            output: {
              amount: isBuy ? undefined : '1000',
              currency: isBuy ? cryptoCode : fiatCode
            }
          }

          try {
            const kRaw = await fetchBityQuote(kRequest, apiUrl)
            const kBityQuote = asBityQuote(kRaw)
            if (isBuy) {
              if (lt(kBityQuote.output.amount, exchangeAmountString)) {
                // Over limit
                console.error(
                  'Bity fetchQuote error: Buy crypto amount exceeds 1000 fiat equivalent',
                  {
                    exchangeAmount: exchangeAmountString,
                    maxCryptoAmount: kBityQuote.output.amount
                  }
                )
                return []
              }
            } else {
              if (lt(kBityQuote.input.amount, exchangeAmountString)) {
                // Over limit
                console.error(
                  'Bity fetchQuote error: Sell crypto amount exceeds 1000 fiat equivalent',
                  {
                    exchangeAmount: exchangeAmountString,
                    maxCryptoAmount: kBityQuote.input.amount
                  }
                )
                return []
              }
            }
          } catch (error) {
            // Return empty array for 1k limit check failures
            console.error(
              'Bity fetchQuote error: Failed to check 1000 fiat limit',
              { error }
            )
            return []
          }
        }
      }

      // Check for a max amount limit from the API
      let quoteAmount
      if (isBuy) {
        quoteAmount =
          amountType === 'fiat'
            ? bityQuote.input.amount
            : bityQuote.output.amount
      } else {
        quoteAmount =
          amountType === 'fiat'
            ? bityQuote.output.amount
            : bityQuote.input.amount
      }
      if (lt(quoteAmount, amount)) {
        // Over limit from API
        console.error(
          'Bity fetchQuote error: Quote amount less than requested amount (API limit)',
          { quoteAmount, requestedAmount: amount }
        )
        return []
      }

      const quote: RampQuoteResult = {
        pluginId,
        partnerIcon,
        pluginDisplayName,
        displayCurrencyCode,
        cryptoAmount: isBuy ? bityQuote.output.amount : bityQuote.input.amount,
        isEstimate: false,
        fiatCurrencyCode,
        fiatAmount: isBuy ? bityQuote.input.amount : bityQuote.output.amount,
        direction,
        regionCode,
        paymentType: supportedPaymentType,
        expirationDate: new Date(Date.now() + 50000),
        settlementRange: {
          min: { value: 15, unit: 'minutes' },
          max: { value: 2, unit: 'hours' }
        },
        approveQuote: async (
          approveParams: RampApproveQuoteParams
        ): Promise<void> => {
          const { coreWallet } = approveParams
          const cryptoAddress = (
            await coreWallet.getReceiveAddress({ tokenId: null })
          ).publicAddress

          // Navigate to SEPA form
          await new Promise<void>((resolve, reject) => {
            navigation.navigate('guiPluginSepaForm', {
              headerTitle: lstrings.sepa_form_title,
              doneLabel: isBuy
                ? lstrings.submit
                : lstrings.string_next_capitalized,
              onDone: async (sepaInfo: SepaInfo) => {
                let approveQuoteRes: BityApproveQuoteResponse | null = null
                try {
                  if (isBuy) {
                    approveQuoteRes = await executeBuyOrderFetch(
                      coreWallet,
                      bityQuote,
                      fiatCode,
                      sepaInfo,
                      outputCurrencyCode,
                      cryptoAddress,
                      clientId,
                      apiUrl
                    )
                  } else {
                    // Sell approval - Needs extra address input step
                    await new Promise<void>((resolve, reject) => {
                      navigation.navigate('guiPluginAddressForm', {
                        countryCode: regionCode.countryCode,
                        headerTitle: lstrings.home_address_title,
                        onSubmit: async (homeAddress: HomeAddress) => {
                          try {
                            approveQuoteRes = await executeSellOrderFetch(
                              coreWallet,
                              bityQuote,
                              inputCurrencyCode,
                              cryptoAddress,
                              outputCurrencyCode,
                              sepaInfo,
                              homeAddress,
                              clientId,
                              apiUrl
                            )
                            resolve()
                          } catch (e) {
                            reject(e)
                          }
                        },
                        onClose: () => {
                          reject(new Error('User cancelled'))
                        }
                      })
                    })
                  }
                } catch (e) {
                  console.error('Bity order error: ', e)

                  const bityError = asMaybe(asBityError)(e)
                  if (bityError?.code === 'exceeds_quota') {
                    showError(
                      sprintf(lstrings.error_kyc_required_s, bityError.message)
                    )
                    reject(new Error('KYC required'))
                    return
                  }
                  showError(lstrings.error_unexpected_title)
                  reject(e)
                  return
                }

                if (approveQuoteRes == null) {
                  reject(new Error('No approval response'))
                  return
                }

                try {
                  if (isBuy) {
                    await completeBuyOrder(approveQuoteRes, navigation)
                  } else {
                    await completeSellOrder(
                      approveQuoteRes,
                      coreWallet,
                      navigation,
                      account,
                      onLogEvent,
                      fiatCurrencyCode,
                      tokenId
                    )
                  }
                  resolve()
                } catch (e: unknown) {
                  if (
                    e instanceof Error &&
                    e.message === SendErrorBackPressed
                  ) {
                    // User cancelled
                    reject(e)
                  } else {
                    throw e
                  }
                }
              },
              onClose: () => {
                reject(new Error('User cancelled'))
              }
            })
          })

          // Pop back to original scene
          navigation.pop()
        },
        closeQuote: async () => {}
      }

      return [quote]
    }
  }

  return plugin
}

/**
 * Transition to the send scene pre-populated with the payment address from the
 * previously opened/approved sell order
 */
const completeSellOrder = async (
  approveQuoteRes: BityApproveQuoteResponse,
  coreWallet: EdgeCurrencyWallet,
  navigation: any,
  account: any,
  onLogEvent: any,
  fiatCurrencyCode: string,
  tokenId: EdgeTokenId
): Promise<void> => {
  const {
    input,
    id,
    payment_details: paymentDetails,
    output
  } = asBitySellApproveQuoteResponse(approveQuoteRes)
  const { amount: inputAmount, currency: inputCurrencyCode } = input
  const { amount: fiatAmount } = output

  const nativeAmount = mul(
    inputAmount,
    getCurrencyCodeMultiplier(coreWallet.currencyConfig, inputCurrencyCode)
  )

  if (nativeAmount == null) {
    throw new Error(
      'Bity: Could not find input denomination: ' + inputCurrencyCode
    )
  }

  const spendInfo: EdgeSpendInfo = {
    tokenId,
    assetAction: {
      assetActionType: 'sell'
    },
    savedAction: {
      actionType: 'fiat',
      orderId: id,
      isEstimate: true,
      fiatPlugin: {
        providerId: pluginId,
        providerDisplayName,
        supportEmail
      },
      payinAddress: paymentDetails.crypto_address,
      cryptoAsset: {
        pluginId: coreWallet.currencyInfo.pluginId,
        tokenId,
        nativeAmount
      },
      fiatAsset: {
        fiatCurrencyCode,
        fiatAmount
      }
    },
    spendTargets: [
      {
        nativeAmount,
        publicAddress: paymentDetails.crypto_address
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
  const tx = await new Promise<EdgeTransaction>((resolve, reject) => {
    navigation.navigate('send2', {
      ...sendParams,
      onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
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
  })

  // Track conversion
  onLogEvent('Sell_Success', {
    conversionValues: {
      conversionType: 'sell',
      destFiatCurrencyCode: fiatCurrencyCode,
      destFiatAmount: fiatAmount,
      fiatProviderId: pluginId,
      orderId: id
    }
  })

  // Save tx action
  if (tokenId != null) {
    const params = {
      walletId: coreWallet.id,
      tokenId,
      txid: tx.txid,
      savedAction: spendInfo.savedAction,
      assetAction: spendInfo.assetAction
    }
    await account.currencyWallets[coreWallet.id].saveTxAction(params)
  }
}

/**
 * Transition to the transfer scene to display the bank transfer information
 * from the previously opened/approved buy order
 */
const completeBuyOrder = async (
  approveQuoteRes: BityApproveQuoteResponse,
  navigation: any
): Promise<void> => {
  const {
    input,
    output,
    id,
    payment_details: paymentDetails
  } = asBityBuyApproveQuoteResponse(approveQuoteRes)

  const { iban, swift_bic: swiftBic, recipient, reference } = paymentDetails

  await new Promise<void>((resolve, reject) => {
    navigation.navigate('guiPluginSepaTransferInfo', {
      headerTitle: lstrings.payment_details,
      promptMessage: sprintf(lstrings.sepa_transfer_prompt_s, id),
      transferInfo: {
        input: {
          amount: input.amount,
          currency: input.currency
        },
        output: {
          amount: output.amount,
          currency: output.currency,
          walletAddress: output.crypto_address
        },
        paymentDetails: {
          id,
          iban,
          swiftBic,
          recipient,
          reference
        }
      },
      onDone: async () => {
        resolve()
      }
    })
  })
}

/**
 * Physically opens the sell order, resulting in payment information detailing
 * where to send crypto (payment address) in order to complete the order.
 */
const executeSellOrderFetch = async (
  coreWallet: EdgeCurrencyWallet,
  bityQuote: any,
  inputCurrencyCode: string,
  cryptoAddress: string,
  outputCurrencyCode: string,
  sepaInfo: { name: string; iban: string; swift: string },
  homeAddress: {
    address: string
    address2: string | undefined
    city: string
    country: string
    state: string
    postalCode: string
  },
  clientId: string,
  apiUrl: string
): Promise<BityApproveQuoteResponse | null> => {
  return await approveBityQuote(
    coreWallet,
    {
      client_value: 0,
      input: {
        amount: bityQuote.input.amount,
        currency: inputCurrencyCode,
        type: 'crypto_address',
        crypto_address: cryptoAddress
      },
      output: {
        currency: outputCurrencyCode,
        type: 'bank_account',
        iban: sepaInfo.iban,
        bic_swift: sepaInfo.swift,
        owner: {
          name: sepaInfo.name,
          street_name: homeAddress.address,
          building_number: homeAddress.address2 ?? '',
          town_name: homeAddress.city,
          country: homeAddress.country,
          country_subdivision: homeAddress.state,
          post_code: homeAddress.postalCode
        }
      },
      partner_fee: { factor: partnerFee }
    },
    clientId,
    apiUrl
  )
}

/**
 * Physically opens the buy order, resulting in payment information detailing
 * where to send fiat (bank details) in order to complete the order.
 */
const executeBuyOrderFetch = async (
  coreWallet: EdgeCurrencyWallet,
  bityQuote: any,
  fiatCode: string,
  sepaInfo: { name: string; iban: string; swift: string },
  outputCurrencyCode: string,
  cryptoAddress: string,
  clientId: string,
  apiUrl: string
): Promise<BityApproveQuoteResponse | null> => {
  return await approveBityQuote(
    coreWallet,
    {
      client_value: 0,
      input: {
        amount: bityQuote.input.amount,
        currency: fiatCode,
        type: 'bank_account',
        iban: sepaInfo.iban,
        bic_swift: sepaInfo.swift
      },
      output: {
        currency: outputCurrencyCode,
        type: 'crypto_address',
        crypto_address: cryptoAddress
      },
      partner_fee: { factor: partnerFee }
    },
    clientId,
    apiUrl
  )
}
