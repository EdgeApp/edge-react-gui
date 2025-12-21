import { gt, lt, mul } from 'biggystring'
import {
  asArray,
  asEither,
  asMaybe,
  asNumber,
  asObject,
  asString,
  asValue
} from 'cleaners'
import type { EdgeTokenId } from 'edge-core-js'
import URL from 'url-parse'

import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast,
  showToastSpinner
} from '../../../components/services/AirshipInstance'
import { requestPermissionOnSettings } from '../../../components/services/PermissionsManager'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import type { StringMap } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import { fetchInfo } from '../../../util/network'
import { makeUuid } from '../../../util/rnUtils'
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
  FiatProviderExactRegions
} from '../../gui/fiatProviderTypes'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import {
  addExactRegion,
  NOT_SUCCESS_TOAST_HIDE_MS,
  RETURN_URL_CANCEL,
  RETURN_URL_FAIL,
  RETURN_URL_SUCCESS,
  validateExactRegion
} from '../../gui/providers/common'
import { addTokenToArray } from '../../gui/util/providerUtils'
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
import { asInitOptions } from './banxaRampTypes'

const pluginId = 'banxa'
const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/banxa.png`
const pluginDisplayName = 'Banxa'

const TESTNET_ADDRESS = 'bc1qv752cnr3rcht3yyfq2nn6nv7zwczqjmcm80y6w'

type AllowedPaymentTypes = Record<
  FiatDirection,
  Partial<Record<FiatPaymentType, boolean>>
>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    applepay: true,
    credit: true,
    googlepay: true,
    ideal: true,
    interac: true,
    iobank: true,
    payid: true,
    sepa: false, // Leave this to Bity for now
    turkishbank: true
  },
  sell: {
    ach: true,
    directtobank: true,
    fasterpayments: true,
    interac: true,
    iobank: true,
    payid: true,
    sepa: false, // Leave this to Bity for now
    turkishbank: true
  }
}

const asBanxaCryptoCoin = asObject({
  coin_code: asString,
  blockchains: asArray(
    asObject({
      code: asString
    })
  )
})

const asBanxaCryptoCoins = asObject({
  data: asObject({
    coins: asArray(asBanxaCryptoCoin)
  })
})

const asBanxaFiat = asObject({
  fiat_code: asString
})

const asBanxaFiats = asObject({
  data: asObject({
    fiats: asArray(asBanxaFiat)
  })
})

const asBanxaTxLimit = asObject({
  fiat_code: asString,
  min: asString,
  max: asString
})

const asBanxaPaymentType = asValue(
  'CLEARJCNSELLFP',
  'CLEARJCNSELLSEPA',
  'CLEARJUNCTION',
  'CLEARJUNCTIONFP',
  'DCINTERAC',
  'DCINTERACSELL',
  'DIRECTCREDIT',
  'DLOCALPIX',
  'DLOCALZAIO',
  'IDEAL',
  'MANUALPAYMENT',
  'MONOOVAPAYID',
  'PRIMERAP',
  'PRIMERCC',
  'WORLDPAYGOOGLE',
  'ZHACHSELL'
)

const asBanxaStatus = asValue('ACTIVE', 'INACTIVE')

const asBanxaPaymentMethod = asObject({
  id: asNumber,
  paymentType: asMaybe(asBanxaPaymentType),
  name: asString,
  status: asBanxaStatus,
  type: asString,
  supported_fiat: asArray(asString),
  supported_coin: asArray(asString),
  transaction_limits: asArray(asBanxaTxLimit)
})

const asBanxaPricesResponse = asObject({
  data: asObject({
    spot_price: asString,
    prices: asArray(
      asObject({
        payment_method_id: asNumber,
        type: asString,
        spot_price_fee: asString,
        spot_price_including_fee: asString,
        coin_amount: asString,
        coin_code: asString,
        fiat_amount: asString,
        fiat_code: asString,
        fee_amount: asString,
        network_fee: asString
      })
    )
  })
})

const asBanxaQuote = asObject({
  id: asString,
  checkout_url: asString
})

const asBanxaError = asObject({
  errors: asObject({
    title: asString
  })
})

const asBanxaQuoteResponse = asEither(
  asObject({
    data: asObject({
      order: asBanxaQuote
    })
  }),
  asBanxaError
)

const asBanxaOrderStatus = asValue(
  'pendingPayment',
  'waitingPayment',
  'paymentReceived',
  'inProgress',
  'coinTransferred',
  'cancelled',
  'declined',
  'expired',
  'complete',
  'refunded'
)

const asBanxaOrderResponse = asObject({
  data: asObject({
    order: asObject({
      id: asString,
      coin_amount: asNumber,
      wallet_address: asMaybe(asString),
      wallet_address_tag: asMaybe(asString),
      status: asBanxaOrderStatus
    })
  })
})

const asBanxaPaymentMethods = asObject({
  data: asObject({
    payment_methods: asArray(asBanxaPaymentMethod)
  })
})

const asBanxaCountry = asObject({
  country_code: asString
})

const asBanxaCountries = asObject({
  data: asObject({
    countries: asArray(asBanxaCountry)
  })
})

const asBanxaState = asObject({
  state_code: asString
})

const asBanxaStates = asObject({
  data: asObject({
    states: asArray(asBanxaState)
  })
})

// Utility function to ensure fiat currency codes have the 'iso:' prefix
const ensureIsoPrefix = (currencyCode: string): string => {
  return currencyCode.startsWith('iso:') ? currencyCode : `iso:${currencyCode}`
}

interface BanxaPaymentIdLimit {
  id: number
  type: FiatPaymentType
  min: string
  max: string
}

type BanxaPaymentMap = Record<
  string,
  Record<string, Record<number, BanxaPaymentIdLimit>>
>

type BanxaTxLimit = ReturnType<typeof asBanxaTxLimit>
type BanxaCryptoCoin = ReturnType<typeof asBanxaCryptoCoin>
type BanxaPaymentType = ReturnType<typeof asBanxaPaymentType>
type BanxaPaymentMethods = ReturnType<typeof asBanxaPaymentMethods>

// https://support.banxa.com/en/support/solutions/articles/44002459218-supported-cryptocurrencies-and-blockchains
// This maps the Banxa blockchain codes to Edge pluginIds
const CURRENCY_PLUGINID_MAP: Record<string, string> = {
  'AVAX-C': 'avalanche',
  BCH: 'bitcoincash',
  BNB: 'binancechain',
  BSC: 'binancesmartchain',
  BTC: 'bitcoin',
  CELO: 'celo',
  DASH: 'dash',
  DGB: 'digibyte',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  EOS: 'eos',
  ETC: 'ethereumclassic',
  ETH: 'ethereum',
  FIL: 'filecoin',
  HBAR: 'hedera',
  LTC: 'litecoin',
  MATIC: 'polygon',
  QTUM: 'qtum',
  RVN: 'ravencoin',
  SOL: 'solana',
  SUI: 'sui',
  TON: 'ton',
  XLM: 'stellar',
  XRP: 'ripple',
  XTZ: 'tezos',
  ZEC: 'zcash'
}

const COIN_TO_CURRENCY_CODE_MAP: StringMap = { BTC: 'BTC' }

const asInfoCreateHmacResponse = asObject({ signature: asString })

const typeMap: Record<BanxaPaymentType, FiatPaymentType> = {
  CLEARJCNSELLFP: 'fasterpayments',
  CLEARJCNSELLSEPA: 'sepa',
  CLEARJUNCTION: 'sepa',
  CLEARJUNCTIONFP: 'fasterpayments',
  DCINTERAC: 'interac',
  DCINTERACSELL: 'interac',
  DIRECTCREDIT: 'directtobank',
  DLOCALPIX: 'pix',
  DLOCALZAIO: 'iobank',
  IDEAL: 'ideal',
  MANUALPAYMENT: 'turkishbank',
  MONOOVAPAYID: 'payid',
  PRIMERAP: 'applepay',
  PRIMERCC: 'credit',
  WORLDPAYGOOGLE: 'googlepay',
  ZHACHSELL: 'ach'
}

// Provider configuration cache
interface ProviderConfigCache {
  data: {
    allowedCountryCodes: FiatProviderExactRegions
    allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
    banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap>
  } | null
  timestamp: number
}

const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
let configCache: ProviderConfigCache = {
  data: null,
  timestamp: 0
}

// Helper functions

// Validation helpers that return boolean values and handle errors gracefully
const isRegionSupported = (
  regionCode: FiatPluginRegionCode,
  allowedCountryCodes: FiatProviderExactRegions
): boolean => {
  try {
    validateExactRegion(pluginId, regionCode, allowedCountryCodes)
    return true
  } catch (error) {
    return false
  }
}

const isCryptoAssetSupported = (
  pluginId: string,
  direction: FiatDirection,
  tokenId: EdgeTokenId,
  allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
): boolean => {
  try {
    edgeToBanxaCrypto(pluginId, direction, tokenId, allowedCurrencyCodes)
    return true
  } catch (error) {
    return false
  }
}

const isFiatSupported = (
  direction: FiatDirection,
  fiatCurrencyCode: string,
  allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
): boolean => {
  try {
    const fiatAssets = allowedCurrencyCodes[direction].fiat
    return fiatAssets[fiatCurrencyCode] === true
  } catch (error) {
    return false
  }
}

const hasAnyPaymentTypeSupport = (direction: FiatDirection): boolean => {
  try {
    const supportedPaymentTypes = Object.keys(
      allowedPaymentTypes[direction]
    ).filter(
      pt => allowedPaymentTypes[direction][pt as FiatPaymentType] === true
    ) as FiatPaymentType[]

    return supportedPaymentTypes.length > 0
  } catch (error) {
    return false
  }
}

const generateHmac = async (
  apiKey: string,
  hmacUser: string,
  data: string,
  nonce: string
): Promise<string> => {
  const body = JSON.stringify({ data })
  const response = await fetchInfo(
    `v1/createHmac/${hmacUser}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    },
    3000
  )
  const reply = await response.json()
  const { signature } = asInfoCreateHmacResponse(reply)

  return `${apiKey}:${signature}:${nonce}`
}

const banxaFetch = async (params: {
  method: 'POST' | 'GET'
  url: string
  path: string
  apiKey: string
  hmacUser: string
  bodyParams?: object
  queryParams?: object
}): Promise<any> => {
  const { hmacUser, method, url, path, apiKey, bodyParams, queryParams } =
    params
  const urlObj = new URL(url + '/' + path, true)
  const body = bodyParams != null ? JSON.stringify(bodyParams) : undefined

  if (method === 'GET' && typeof queryParams === 'object') {
    urlObj.set('query', queryParams)
  }

  const hmacpath = urlObj.href.replace(urlObj.origin + '/', '')

  const nonce = Date.now().toString()
  let hmacData = method + '\n' + hmacpath + '\n' + nonce
  hmacData += method === 'POST' ? '\n' + (body ?? '') : ''

  const hmac = await generateHmac(apiKey, hmacUser, hmacData, nonce)
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hmac}`
    },
    body
  }
  const response = await fetch(urlObj.href, options)
  const reply = await response.json()
  return reply
}

const findLimit = (
  fiatCode: string,
  banxaLimits: BanxaTxLimit[]
): BanxaTxLimit | undefined => {
  for (const limit of banxaLimits) {
    if (limit.fiat_code === fiatCode) {
      return limit
    }
  }
}

const buildPaymentsMap = (
  banxaPayments: BanxaPaymentMethods,
  banxaPaymentsMap: BanxaPaymentMap
): void => {
  const { payment_methods: methods } = banxaPayments.data
  for (const pm of methods) {
    const { paymentType } = pm
    if (paymentType == null) continue
    const pt = typeMap[paymentType]
    if (pm.status !== 'ACTIVE') {
      continue
    }
    if (pt != null) {
      for (const fiat of pm.supported_fiat) {
        banxaPaymentsMap[fiat] ??= {}
        for (const coin of pm.supported_coin) {
          banxaPaymentsMap[fiat][coin] ??= {}

          const limit = findLimit(fiat, pm.transaction_limits)
          if (limit == null) {
            console.error(
              `Missing limits for id:${pm.id} ${pm.paymentType} ${fiat}`
            )
          } else {
            const newMap: BanxaPaymentIdLimit = {
              id: pm.id,
              min: limit.min,
              max: limit.max,
              type: pt
            }
            if (banxaPaymentsMap[fiat][coin][pm.id] != null) {
              if (
                JSON.stringify(banxaPaymentsMap[fiat][coin][pm.id]) !==
                JSON.stringify(newMap)
              ) {
                console.error(
                  `Payment already exists with different values: ${fiat} ${coin} ${pt}`
                )
                continue
              }
            }
            banxaPaymentsMap[fiat][coin][pm.id] = newMap
          }
        }
      }
    }
  }
}

const getPaymentIdLimit = (
  direction: FiatDirection,
  fiat: string,
  banxaCoin: string,
  type: FiatPaymentType,
  banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap>
): BanxaPaymentIdLimit | undefined => {
  try {
    const payments = banxaPaymentsMap[direction][fiat][banxaCoin]
    const paymentId = Object.values(payments).find(p => p.type === type)
    return paymentId
  } catch (e) {}
}

// Takes an EdgeAsset and returns the corresponding Banxa chain code and coin code
const edgeToBanxaCrypto = (
  pluginId: string,
  direction: FiatDirection,
  tokenId: EdgeTokenId,
  allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
): { banxaChain: string; banxaCoin: string } => {
  const tokens = allowedCurrencyCodes[direction].crypto[pluginId]
  if (tokens == null)
    throw new Error(`edgeToBanxaCrypto ${pluginId} not allowed`)
  const providerToken = tokens.find(t => t.tokenId === tokenId)
  const banxaCoin = asBanxaCryptoCoin(providerToken?.otherInfo)
  if (banxaCoin == null)
    throw new Error(`edgeToBanxaCrypto ${pluginId} ${tokenId} not allowed`)
  for (const chain of banxaCoin.blockchains) {
    const edgePluginId = CURRENCY_PLUGINID_MAP[chain.code]
    if (edgePluginId === pluginId) {
      return { banxaChain: chain.code, banxaCoin: banxaCoin.coin_code }
    }
  }
  throw new Error(`edgeToBanxaCrypto No matching pluginId ${pluginId}`)
}

export const banxaRampPlugin: RampPluginFactory = (
  config: RampPluginConfig
): RampPlugin => {
  const { apiKey, hmacUser, apiUrl } = asInitOptions(config.initOptions)
  const { account, navigation, onLogEvent, disklet } = config

  let testnet = false
  if (apiUrl.includes('sandbox')) {
    testnet = true
    CURRENCY_PLUGINID_MAP.BTC = 'bitcointestnet'
    COIN_TO_CURRENCY_CODE_MAP.BTC = 'TESTBTC'
  }

  let banxaUsername: string | undefined

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  const initializeBanxaUsername = async (): Promise<string> => {
    if (banxaUsername != null) return banxaUsername

    banxaUsername = await config.store
      .getItem('username')
      .catch(() => undefined)
    if (banxaUsername == null || banxaUsername === '') {
      banxaUsername = await makeUuid()
      await config.store.setItem('username', banxaUsername)
    }

    return banxaUsername
  }

  const addToAllowedCurrencies = (
    pluginId: string,
    direction: FiatDirection,
    currencyCode: string,
    coin: BanxaCryptoCoin,
    allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
  ): void => {
    let tokenId: EdgeTokenId = null
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig != null) {
      const resolvedTokenId = getTokenId(currencyConfig, currencyCode)
      // Skip coins that are not recognized by Edge (resolvedTokenId === undefined)
      if (resolvedTokenId === undefined) {
        return
      }
      tokenId = resolvedTokenId
    } else {
      // Without a currencyConfig we cannot resolve tokens safely
      return
    }

    allowedCurrencyCodes[direction].crypto[pluginId] ??= []
    const tokens = allowedCurrencyCodes[direction].crypto[pluginId]
    // Only store if we can map at least one Banxa chain back to the same pluginId
    const hasMatchingChain = coin.blockchains.some(chain => {
      const edgePluginId = CURRENCY_PLUGINID_MAP[chain.code]
      return edgePluginId === pluginId
    })
    if (!hasMatchingChain) return

    addTokenToArray({ tokenId, otherInfo: coin }, tokens)
  }

  const fetchProviderConfig = async (): Promise<{
    allowedCountryCodes: FiatProviderExactRegions
    allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap>
    banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap>
  }> => {
    const now = Date.now()

    // Check if cache is valid
    if (
      configCache.data != null &&
      now - configCache.timestamp < CACHE_TTL_MS
    ) {
      return configCache.data
    }

    // Initialize empty data structures
    const allowedCountryCodes: FiatProviderExactRegions = {}
    const allowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = {
      buy: { providerId: pluginId, fiat: {}, crypto: {} },
      sell: { providerId: pluginId, fiat: {}, crypto: {} }
    }
    const banxaPaymentsMap: Record<FiatDirection, BanxaPaymentMap> = {
      buy: {},
      sell: {}
    }

    // Fetch configuration in parallel
    const promises = [
      // Fetch countries
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: 'api/countries',
        apiKey
      }).then(response => {
        const countries = asBanxaCountries(response)
        for (const { country_code: countryCode } of countries.data.countries) {
          if (countryCode !== 'US') {
            addExactRegion(allowedCountryCodes, countryCode)
          }
        }
      }),

      // Fetch US states
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: 'api/countries/us/states',
        apiKey
      }).then(response => {
        const states = asBanxaStates(response)
        for (const { state_code: stateCode } of states.data.states) {
          addExactRegion(allowedCountryCodes, 'US', stateCode)
        }
      }),

      // Fetch sell crypto
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: `api/coins/sell`,
        apiKey
      }).then(response => {
        const cryptoCurrencies = asBanxaCryptoCoins(response)
        for (const coin of cryptoCurrencies.data.coins) {
          for (const chain of coin.blockchains) {
            const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
            if (currencyPluginId != null) {
              const edgeCurrencyCode =
                COIN_TO_CURRENCY_CODE_MAP[coin.coin_code] ?? coin.coin_code
              addToAllowedCurrencies(
                currencyPluginId,
                'sell',
                edgeCurrencyCode,
                coin,
                allowedCurrencyCodes
              )
            }
          }
        }
      }),

      // Fetch sell fiat
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: `api/fiats/sell`,
        apiKey
      }).then(response => {
        const fiatCurrencies = asBanxaFiats(response)
        for (const fiat of fiatCurrencies.data.fiats) {
          allowedCurrencyCodes.sell.fiat['iso:' + fiat.fiat_code] = true
        }
      }),

      // Fetch buy crypto
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: `api/coins/buy`,
        apiKey
      }).then(response => {
        const cryptoCurrencies = asBanxaCryptoCoins(response)
        for (const coin of cryptoCurrencies.data.coins) {
          for (const chain of coin.blockchains) {
            const currencyPluginId = CURRENCY_PLUGINID_MAP[chain.code]
            if (currencyPluginId != null) {
              const edgeCurrencyCode =
                COIN_TO_CURRENCY_CODE_MAP[coin.coin_code] ?? coin.coin_code
              addToAllowedCurrencies(
                currencyPluginId,
                'buy',
                edgeCurrencyCode,
                coin,
                allowedCurrencyCodes
              )
            }
          }
        }
      }),

      // Fetch buy fiat
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: `api/fiats/buy`,
        apiKey
      }).then(response => {
        const fiatCurrencies = asBanxaFiats(response)
        for (const fiat of fiatCurrencies.data.fiats) {
          allowedCurrencyCodes.buy.fiat['iso:' + fiat.fiat_code] = true
        }
      }),

      // Fetch buy payment methods
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: 'api/payment-methods',
        apiKey
      }).then(response => {
        const banxaPayments = asBanxaPaymentMethods(response)
        buildPaymentsMap(banxaPayments, banxaPaymentsMap.buy)
      }),

      // Fetch sell payment methods (with BTC hack for better coverage)
      banxaFetch({
        method: 'GET',
        url: apiUrl,
        hmacUser,
        path: 'api/payment-methods?source=BTC',
        apiKey
      }).then(response => {
        const banxaPayments = asBanxaPaymentMethods(response)
        buildPaymentsMap(banxaPayments, banxaPaymentsMap.sell)
      })
    ]

    await Promise.all(promises)

    // Update cache
    const newConfig = {
      allowedCountryCodes,
      allowedCurrencyCodes,
      banxaPaymentsMap
    }

    configCache = {
      data: newConfig,
      timestamp: now
    }

    return newConfig
  }

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes } = config

      // Get supported payment types for this direction
      const supportedPaymentTypes = Object.keys(
        allowedPaymentTypes[request.direction]
      ).filter(
        pt =>
          allowedPaymentTypes[request.direction][pt as FiatPaymentType] === true
      ) as FiatPaymentType[]

      // Global constraints pre-check
      const constraintOk = validateRampCheckSupportRequest(
        pluginId,
        request,
        supportedPaymentTypes
      )
      if (!constraintOk) return { supported: false }

      // Check region support
      if (!isRegionSupported(request.regionCode, allowedCountryCodes)) {
        return { supported: false }
      }

      // Check if any payment types are supported for this direction
      if (!hasAnyPaymentTypeSupport(request.direction)) {
        return { supported: false }
      }

      // Check fiat support
      const fiatCurrencyCode = ensureIsoPrefix(request.fiatAsset.currencyCode)
      if (
        !isFiatSupported(
          request.direction,
          fiatCurrencyCode,
          allowedCurrencyCodes
        )
      ) {
        return { supported: false }
      }

      // Check crypto asset support
      if (
        !isCryptoAssetSupported(
          request.cryptoAsset.pluginId,
          request.direction,
          request.cryptoAsset.tokenId,
          allowedCurrencyCodes
        )
      ) {
        return { supported: false }
      }

      return {
        supported: true,
        supportedAmountTypes: ['fiat', 'crypto']
      }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const {
        direction,
        regionCode,
        amountType,
        fiatCurrencyCode,
        displayCurrencyCode,
        tokenId
      } = request
      const currencyPluginId = request.wallet.currencyInfo.pluginId

      const isMaxAmount =
        'max' in request.amountQuery ||
        'maxExchangeAmount' in request.amountQuery
      const exchangeAmount =
        'exchangeAmount' in request.amountQuery
          ? request.amountQuery.exchangeAmount
          : ''
      const maxAmountLimit =
        'maxExchangeAmount' in request.amountQuery
          ? request.amountQuery.maxExchangeAmount
          : undefined

      // Fetch provider configuration (cached or fresh)
      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes, banxaPaymentsMap } =
        config

      // Validate region
      if (!isRegionSupported(regionCode, allowedCountryCodes)) {
        return []
      }

      // Check if any payment types are supported for this direction
      if (!hasAnyPaymentTypeSupport(direction)) {
        return []
      }

      // Check if fiat is supported
      const isoFiatCurrencyCode = ensureIsoPrefix(fiatCurrencyCode)
      if (
        !isFiatSupported(direction, isoFiatCurrencyCode, allowedCurrencyCodes)
      ) {
        return []
      }

      // Check if crypto is supported and get the mapping
      if (
        !isCryptoAssetSupported(
          currencyPluginId,
          direction,
          tokenId,
          allowedCurrencyCodes
        )
      ) {
        return []
      }

      // Get supported payment types for this direction
      const supportedPaymentTypes = Object.keys(
        allowedPaymentTypes[direction]
      ).filter(
        pt => allowedPaymentTypes[direction][pt as FiatPaymentType] === true
      ) as FiatPaymentType[]

      // Get the crypto mapping (we know it's supported at this point)
      const fiatCode = removeIsoPrefix(isoFiatCurrencyCode)

      const banxaCrypto = edgeToBanxaCrypto(
        currencyPluginId,
        direction,
        tokenId,
        allowedCurrencyCodes
      )
      const banxaChain = banxaCrypto.banxaChain
      const banxaCoin = banxaCrypto.banxaCoin

      // Initialize username
      const username = await initializeBanxaUsername()

      // Collect quotes for all payment types
      const quotes: RampQuote[] = []

      const errors: unknown[] = []
      for (const paymentType of supportedPaymentTypes) {
        // Constraints per request
        const constraintOk = validateRampQuoteRequest(
          pluginId,
          request,
          paymentType
        )
        if (!constraintOk) continue

        try {
          // Find payment method for this type
          let paymentObj: BanxaPaymentIdLimit | undefined
          let hasFetched = false

          while (true) {
            paymentObj = getPaymentIdLimit(
              direction,
              fiatCode,
              banxaCoin,
              paymentType,
              banxaPaymentsMap
            )

            if (paymentObj != null) break

            // If buying, all payment methods were already queried
            if (direction === 'buy' || hasFetched) {
              break // Skip this payment type
            }

            // For sell, fetch payment methods for specific crypto
            const pmResponse = await banxaFetch({
              method: 'GET',
              url: apiUrl,
              hmacUser,
              path: `api/payment-methods?source=${banxaCoin}`,
              apiKey
            })
            const banxaPayments = asBanxaPaymentMethods(pmResponse)
            buildPaymentsMap(banxaPayments, banxaPaymentsMap.sell)
            hasFetched = true
          }

          if (paymentObj == null) continue // Skip unsupported payment type

          // Check limits
          const checkMinMax = (
            amount: string,
            paymentIdLimit: BanxaPaymentIdLimit
          ): boolean => {
            if (
              gt(amount, paymentIdLimit.max) ||
              lt(amount, paymentIdLimit.min)
            ) {
              return false
            }
            return true
          }

          // Build query parameters
          const queryParams: any = {
            account_reference: username,
            payment_method_id: paymentObj.id
          }

          let maxAmountString = ''
          if (isMaxAmount) {
            if (amountType === 'fiat') {
              maxAmountString = paymentObj.max
            } else {
              // For crypto, we need to fetch a quote with max fiat to get the crypto amount
              const maxFiatQueryParams: any = {
                account_reference: username,
                payment_method_id: paymentObj.id,
                source: direction === 'buy' ? fiatCode : banxaCoin,
                target: direction === 'buy' ? banxaCoin : fiatCode
              }
              if (direction === 'buy') {
                maxFiatQueryParams.source_amount = paymentObj.max
              } else {
                maxFiatQueryParams.target_amount = paymentObj.max
              }
              const maxResponse = await banxaFetch({
                method: 'GET',
                url: apiUrl,
                hmacUser,
                path: 'api/prices',
                apiKey,
                queryParams: maxFiatQueryParams
              })
              const maxPrices = asBanxaPricesResponse(maxResponse)
              const maxPriceRow = maxPrices.data.prices.find(p => {
                return (
                  p.payment_method_id === paymentObj!.id &&
                  p.coin_code === banxaCoin &&
                  p.fiat_code === fiatCode
                )
              })
              if (maxPriceRow == null) {
                // If no matching row is found, skip this payment type
                continue
              }
              maxAmountString = maxPriceRow.coin_amount

              if (
                maxAmountLimit != null &&
                gt(maxAmountString, maxAmountLimit)
              ) {
                maxAmountString = maxAmountLimit
              }
            }
          }

          if (direction === 'buy') {
            queryParams.source = fiatCode
            queryParams.target = banxaCoin
            if (amountType === 'fiat') {
              queryParams.source_amount = isMaxAmount
                ? maxAmountString
                : exchangeAmount
              if (gt(queryParams.source_amount, paymentObj.max)) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'overLimit',
                  errorAmount: parseFloat(paymentObj.max),
                  displayCurrencyCode: fiatCurrencyCode
                })
              } else if (lt(queryParams.source_amount, paymentObj.min)) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'underLimit',
                  errorAmount: parseFloat(paymentObj.min),
                  displayCurrencyCode: fiatCurrencyCode
                })
              }
            } else {
              queryParams.target_amount = isMaxAmount
                ? maxAmountString
                : exchangeAmount
            }
          } else {
            queryParams.source = banxaCoin
            queryParams.target = fiatCode
            if (amountType === 'fiat') {
              queryParams.target_amount = isMaxAmount
                ? maxAmountString
                : exchangeAmount
              if (gt(queryParams.target_amount, paymentObj.max)) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'overLimit',
                  errorAmount: parseFloat(paymentObj.max),
                  displayCurrencyCode: fiatCurrencyCode
                })
              } else if (lt(queryParams.target_amount, paymentObj.min)) {
                throw new FiatProviderError({
                  providerId: pluginId,
                  errorType: 'underLimit',
                  errorAmount: parseFloat(paymentObj.min),
                  displayCurrencyCode: fiatCurrencyCode
                })
              }
            } else {
              queryParams.source_amount = isMaxAmount
                ? maxAmountString
                : exchangeAmount
            }
          }

          // Fetch price quote
          const response = await banxaFetch({
            method: 'GET',
            url: apiUrl,
            hmacUser,
            path: 'api/prices',
            apiKey,
            queryParams
          })
          const banxaPrices = asBanxaPricesResponse(response)
          const priceRow = banxaPrices.data.prices.find(p => {
            return (
              p.payment_method_id === paymentObj!.id &&
              p.coin_code === banxaCoin &&
              p.fiat_code === fiatCode
            )
          })
          if (priceRow == null) {
            // No exact match for this payment type; try next one
            continue
          }

          // Check final amounts against limits
          // TODO: Throw the correct error message based on fiat vs crypto,
          // currently only fiat limit errors are shown.
          if (!checkMinMax(priceRow.fiat_amount, paymentObj)) {
            if (gt(priceRow.fiat_amount, paymentObj.max)) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'overLimit',
                errorAmount: parseFloat(paymentObj.max),
                displayCurrencyCode: fiatCurrencyCode
              })
            } else if (lt(priceRow.fiat_amount, paymentObj.min)) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'underLimit',
                errorAmount: parseFloat(paymentObj.min),
                displayCurrencyCode: fiatCurrencyCode
              })
            }
          }

          // Create quote result
          const quoteFiatAmount = priceRow.fiat_amount
          const quoteCryptoAmount = priceRow.coin_amount
          const quote: RampQuote = {
            pluginId,
            partnerIcon,
            pluginDisplayName,
            displayCurrencyCode,
            cryptoAmount: quoteCryptoAmount,
            isEstimate: false,
            fiatCurrencyCode,
            fiatAmount: quoteFiatAmount,
            direction,
            regionCode,
            paymentType,
            expirationDate: new Date(Date.now() + 50000),
            settlementRange: getSettlementRange(paymentType, direction),
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
              // Prefer transparent or segwit address where available; fallback to default
              const addresses = await coreWallet.getAddresses({ tokenId: null })
              const getAddressTypePriority = (
                type: string | undefined
              ): number => {
                if (type === 'transparentAddress') return 1
                if (type === 'segwitAddress') return 1
                return 2
              }
              // Sort addresses by priority
              addresses.sort(
                (a, b) =>
                  getAddressTypePriority(a.addressType) -
                  getAddressTypePriority(b.addressType)
              )
              const [receiveAddress] = addresses
              if (receiveAddress == null)
                throw new Error('Banxa missing receive address')

              const bodyParams: any = {
                payment_method_id: paymentObj?.id ?? '',
                account_reference: username,
                source: queryParams.source,
                target: queryParams.target,
                blockchain: banxaChain,
                return_url_on_success:
                  direction === 'buy'
                    ? `https://deep.edge.app/ramp/buy/banxa?status=success`
                    : RETURN_URL_SUCCESS,
                return_url_on_cancelled:
                  direction === 'buy'
                    ? `https://deep.edge.app/ramp/buy/banxa?status=cancelled`
                    : RETURN_URL_CANCEL,
                return_url_on_failure:
                  direction === 'buy'
                    ? `https://deep.edge.app/ramp/buy/banxa?status=failure`
                    : RETURN_URL_FAIL
              }
              if (direction === 'buy') {
                if (testnet && banxaChain === 'BTC') {
                  bodyParams.wallet_address = TESTNET_ADDRESS
                } else {
                  bodyParams.wallet_address = receiveAddress.publicAddress
                }
              } else {
                if (testnet && banxaChain === 'BTC') {
                  bodyParams.refund_address = TESTNET_ADDRESS
                } else {
                  bodyParams.refund_address = receiveAddress.publicAddress
                }
              }

              if (queryParams.source_amount != null) {
                bodyParams.source_amount = queryParams.source_amount
              } else {
                bodyParams.target_amount = queryParams.target_amount
              }

              const promise = banxaFetch({
                method: 'POST',
                url: apiUrl,
                hmacUser,
                path: 'api/orders',
                apiKey,
                bodyParams
              })
              const response = await showToastSpinner(
                lstrings.fiat_plugin_finalizing_quote,
                promise
              )
              const banxaQuote = asBanxaQuoteResponse(response)

              if ('errors' in banxaQuote) {
                throw new Error(banxaQuote.errors.title)
              }

              let interval: ReturnType<typeof setInterval> | undefined
              let insideInterval = false

              if (direction === 'buy') {
                await openExternalWebView({
                  url: banxaQuote.data.order.checkout_url,
                  deeplink: {
                    direction: 'buy',
                    providerId: pluginId,
                    handler: async link => {
                      const orderResponse = await banxaFetch({
                        method: 'GET',
                        url: apiUrl,
                        hmacUser,
                        path: `api/orders/${banxaQuote.data.order.id}`,
                        apiKey
                      })
                      const order = asBanxaOrderResponse(orderResponse)
                      // Banxa will incorrectly add their query string parameters
                      // to the url with a simple concatenation of '?orderId=...',
                      // and this will break our query string.
                      const status = link.query.status?.replace('?', '')

                      switch (status) {
                        case 'success': {
                          onLogEvent('Buy_Success', {
                            conversionValues: {
                              conversionType: 'buy',
                              sourceFiatCurrencyCode: fiatCurrencyCode,
                              sourceFiatAmount: quoteFiatAmount,
                              destAmount: new CryptoAmount({
                                currencyConfig: coreWallet.currencyConfig,
                                tokenId,
                                exchangeAmount: order.data.order.coin_amount
                              }),
                              fiatProviderId: pluginId,
                              orderId: banxaQuote.data.order.id
                            }
                          })
                          navigation.pop()
                          break
                        }
                        case 'cancelled': {
                          console.log(
                            'Banxa WebView launch buy cancelled: ' + link.uri
                          )
                          showToast(
                            lstrings.fiat_plugin_buy_cancelled,
                            NOT_SUCCESS_TOAST_HIDE_MS
                          )
                          navigation.pop()
                          break
                        }
                        case 'failure': {
                          console.log(
                            'Banxa WebView launch buy failure: ' + link.uri
                          )
                          showToast(
                            lstrings.fiat_plugin_buy_failed_try_again,
                            NOT_SUCCESS_TOAST_HIDE_MS
                          )
                          navigation.pop()
                          break
                        }
                        default: {
                          showToast(
                            lstrings.fiat_plugin_buy_unknown_status,
                            NOT_SUCCESS_TOAST_HIDE_MS
                          )
                          navigation.pop()
                        }
                      }
                    }
                  }
                })
              } else {
                // Sell flow with internal webview
                const { checkout_url: checkoutUrl, id } = banxaQuote.data.order
                const banxaUrl = new URL(checkoutUrl)
                const { origin: banxaOrigin } = banxaUrl

                navigation.navigate('guiPluginWebView', {
                  url: checkoutUrl,
                  onClose: () => {
                    clearInterval(interval)
                  },
                  onUrlChange: async (changeUrl: string): Promise<void> => {
                    console.log(`onUrlChange url=${changeUrl}`)
                    if (changeUrl === RETURN_URL_SUCCESS) {
                      clearInterval(interval)
                      navigation.pop()
                    } else if (changeUrl === RETURN_URL_CANCEL) {
                      clearInterval(interval)
                      showToast(
                        lstrings.fiat_plugin_sell_cancelled,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                      navigation.pop()
                    } else if (changeUrl === RETURN_URL_FAIL) {
                      clearInterval(interval)
                      showToast(
                        lstrings.fiat_plugin_sell_failed_try_again,
                        NOT_SUCCESS_TOAST_HIDE_MS
                      )
                      navigation.pop()
                    } else if (changeUrl.startsWith(`${banxaOrigin}/status/`)) {
                      interval ??= setInterval(() => {
                        checkOrderStatus().catch((err: unknown) => {
                          console.warn(
                            `Failed to check banxa order status: ${String(err)}`
                          )
                        })
                      }, 3000)
                      async function checkOrderStatus(): Promise<void> {
                        try {
                          if (insideInterval) return
                          insideInterval = true
                          const orderResponse = await banxaFetch({
                            method: 'GET',
                            url: apiUrl,
                            hmacUser,
                            path: `api/orders/${id}`,
                            apiKey
                          })
                          const order = asBanxaOrderResponse(orderResponse)
                          const {
                            coin_amount: coinAmount,
                            status,
                            wallet_address: publicAddress
                          } = order.data.order
                          const { multiplier } = getExchangeDenom(
                            coreWallet.currencyConfig,
                            tokenId
                          )
                          const nativeAmount = mul(
                            coinAmount.toString(),
                            multiplier
                          )
                          if (status === 'waitingPayment') {
                            // Launch the SendScene to make payment
                            const sendParams: SendScene2Params = {
                              walletId: coreWallet.id,
                              tokenId,
                              spendInfo: {
                                tokenId,
                                spendTargets: [
                                  {
                                    nativeAmount,
                                    publicAddress
                                  }
                                ]
                              },
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
                            const edgeTx = await new Promise<any>(
                              (resolve, reject) => {
                                navigation.navigate('send2', {
                                  ...sendParams,
                                  onDone: (error: unknown, tx?: any) => {
                                    if (error != null) {
                                      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                      reject(error)
                                    } else if (tx != null) {
                                      resolve(tx)
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

                            // At this point we'll call it success
                            clearInterval(interval)
                            interval = undefined

                            onLogEvent('Sell_Success', {
                              conversionValues: {
                                conversionType: 'sell',
                                destFiatCurrencyCode: fiatCurrencyCode,
                                destFiatAmount: quoteFiatAmount,
                                sourceAmount: new CryptoAmount({
                                  currencyConfig: coreWallet.currencyConfig,
                                  tokenId,
                                  exchangeAmount: coinAmount
                                }),
                                fiatProviderId: pluginId,
                                orderId: id
                              }
                            })

                            // Below is an optional step
                            const { txid } = edgeTx
                            // Post the txid back to Banxa
                            const bodyParams = {
                              tx_hash: txid,
                              source_address: receiveAddress.publicAddress,
                              destination_address: publicAddress
                            }
                            await banxaFetch({
                              method: 'POST',
                              url: apiUrl,
                              hmacUser,
                              path: `api/orders/${id}/confirm`,
                              apiKey,
                              bodyParams
                            })
                          }
                          insideInterval = false
                        } catch (e: unknown) {
                          if (
                            e instanceof Error &&
                            e.message === SendErrorBackPressed
                          ) {
                            navigation.pop()
                          } else if (
                            e instanceof Error &&
                            e.message === SendErrorNoTransaction
                          ) {
                            navigation.pop()
                            showToast(
                              lstrings.fiat_plugin_sell_failed_to_send_try_again
                            )
                          } else {
                            showError(e)
                          }
                          insideInterval = false
                        }
                      }
                    }
                  }
                })
              }
            },
            closeQuote: async (): Promise<void> => {}
          }

          quotes.push(quote)
        } catch (error) {
          // Continue with other payment types
          errors.push(error)
        }
      }

      // If no quotes were found and there were errors, throw an aggregate error
      if (quotes.length === 0 && errors.length > 0) {
        throw new AggregateError(errors, 'All quotes failed')
      }

      return quotes
    }
  }

  return plugin
}
