import { mul } from 'biggystring'
import type {
  EdgeAssetAction,
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTokenId,
  EdgeTxActionFiat
} from 'edge-core-js'
import React from 'react'
import { sprintf } from 'sprintf-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import { TextInputModal } from '../../../components/modals/TextInputModal'
import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  Airship,
  showError,
  showToast,
  showToastSpinner
} from '../../../components/services/AirshipInstance'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import type { SepaInfo } from '../../../types/FormTypes'
import type { StringMap } from '../../../types/types'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { findTokenIdByNetworkLocation } from '../../../util/CurrencyInfoHelpers'
import { removeIsoPrefix } from '../../../util/utils'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import type {
  FiatDirection,
  FiatPaymentType,
  FiatPluginRegionCode,
  FiatPluginSepaTransferInfo
} from '../../gui/fiatPluginTypes'
import {
  FiatProviderError,
  type FiatProviderExactRegions,
  type ProviderToken
} from '../../gui/fiatProviderTypes'
import {
  addExactRegion,
  NOT_SUCCESS_TOAST_HIDE_MS,
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
import {
  asDfxAssets,
  asDfxAuthResponse,
  asDfxBuyPaymentInfo,
  asDfxCountries,
  asDfxFiats,
  asDfxQuote,
  asDfxSellPaymentInfo,
  asInitOptions,
  type DfxAsset,
  type DfxFiat,
  type DfxPaymentMethod
} from './dfxRampTypes'

const pluginId = 'dfx'
const partnerIcon = 'https://app.dfx.swiss/logo.png'
const pluginDisplayName = 'DFX.swiss'
const supportEmail = 'support@dfx.swiss'

// ---------------------------------------------------------------------------
// Blockchain mapping: DFX blockchain name → Edge pluginId
// ---------------------------------------------------------------------------

const DFX_BLOCKCHAIN_MAP: StringMap = {
  Bitcoin: 'bitcoin',
  Ethereum: 'ethereum',
  Arbitrum: 'arbitrum',
  Optimism: 'optimism',
  Polygon: 'polygon',
  Base: 'base',
  BinanceSmartChain: 'binancesmartchain',
  Solana: 'solana',
  Tron: 'tron',
  Monero: 'monero',
  Cardano: 'cardano',
  Zano: 'zano'
}

// Reverse map: Edge pluginId → DFX blockchain name
const EDGE_TO_DFX_BLOCKCHAIN: StringMap = Object.fromEntries(
  Object.entries(DFX_BLOCKCHAIN_MAP).map(([k, v]) => [v, k])
)

// Native coin names per DFX blockchain. DFX returns wrapped-token contract
// addresses even for native coins (e.g. WETH address for ETH). We detect
// native coins by name and set tokenId to null instead of looking up by contract.
const DFX_NATIVE_COIN_NAMES: Record<string, string> = {
  Bitcoin: 'BTC',
  Ethereum: 'ETH',
  Arbitrum: 'ETH',
  Optimism: 'ETH',
  Polygon: 'POL',
  Base: 'ETH',
  BinanceSmartChain: 'BNB',
  Solana: 'SOL',
  Tron: 'TRX',
  Monero: 'XMR',
  Cardano: 'ADA',
  Zano: 'ZANO'
}

// Countries where DFX is not available
const BLOCKED_COUNTRIES = new Set(['IR', 'KP', 'MM', 'US', 'IL'])

// Format settlement range as "min - max" days string for display
const formatSettlementDays = (
  range: ReturnType<typeof getSettlementRange>
): string => {
  const min = range.min.unit === 'days' ? range.min.value : 0
  const max = range.max.unit === 'days' ? range.max.value : 1
  return `${min} - ${max}`
}

// EVM chains that require hex-encoded message for signing
const EVM_CHAINS = new Set([
  'ethereum',
  'arbitrum',
  'optimism',
  'polygon',
  'base',
  'binancesmartchain'
])

// ---------------------------------------------------------------------------
// Payment type mapping: DFX → Edge
// ---------------------------------------------------------------------------

const DFX_PAYMENT_TYPE_MAP: Record<DfxPaymentMethod, FiatPaymentType> = {
  Bank: 'sepa'
}

// ---------------------------------------------------------------------------
// Asset map type
// ---------------------------------------------------------------------------

interface AssetMap {
  providerId: string
  fiat: Record<string, DfxFiat>
  crypto: Record<string, ProviderToken[]>
}

interface DfxQuoteBody {
  currency: { id: number }
  asset: { id: number; blockchain: string }
  paymentMethod: DfxPaymentMethod
  amount?: number
  targetAmount?: number
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface ProviderConfigCache {
  data: {
    allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions>
    allowedCurrencyCodes: Record<
      FiatDirection,
      Partial<Record<FiatPaymentType, AssetMap>>
    >
  }
  timestamp: number
}

const CACHE_TTL = 2 * 60 * 1000

// Auth token cache
interface AuthCache {
  token: string
  timestamp: number
}
const AUTH_TTL = 15 * 60 * 1000

// ---------------------------------------------------------------------------
// Helper: build auth message per DFX spec
// ---------------------------------------------------------------------------

const buildAuthMessage = (address: string): string =>
  `By_signing_this_message,_you_confirm_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_${address}`

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

export const dfxRampPlugin: RampPluginFactory = (
  pluginConfig: RampPluginConfig
): RampPlugin => {
  const { account, navigation, onLogEvent } = pluginConfig
  const initOptions = asInitOptions(pluginConfig.initOptions)
  const { apiUrl, webAppUrl } = initOptions

  let providerCache: ProviderConfigCache | null = null
  const authCacheMap = new Map<string, AuthCache>()

  const rampInfo: RampInfo = {
    partnerIcon,
    pluginDisplayName
  }

  // -----------------------------------------------------------------------
  // Auth: wallet signature → JWT
  // -----------------------------------------------------------------------

  const getDfxAuth = async (wallet: EdgeCurrencyWallet): Promise<string> => {
    const address = await getBestAddress(wallet)

    const cached = authCacheMap.get(address)
    if (cached != null && Date.now() - cached.timestamp < AUTH_TTL) {
      return cached.token
    }

    const message = buildAuthMessage(address)

    let signature: string
    if (EVM_CHAINS.has(wallet.currencyInfo.pluginId)) {
      const hexMessage = Buffer.from(message, 'utf8').toString('hex')
      signature = await wallet.signMessage(hexMessage)
    } else {
      signature = await wallet.signMessage(message, {
        otherParams: { publicAddress: address }
      })
    }

    const response = await fetch(`${apiUrl}/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        signature,
        wallet: 'edge'
      })
    })

    if (!response.ok) {
      throw new Error(`DFX auth failed: ${response.status}`)
    }

    const result = asDfxAuthResponse(await response.json())
    authCacheMap.set(address, {
      token: result.accessToken,
      timestamp: Date.now()
    })
    return result.accessToken
  }

  // -----------------------------------------------------------------------
  // Provider config (cached)
  // -----------------------------------------------------------------------

  const fetchProviderConfig = async (): Promise<
    ProviderConfigCache['data']
  > => {
    if (
      providerCache != null &&
      Date.now() - providerCache.timestamp < CACHE_TTL
    ) {
      return providerCache.data
    }

    const freshConfig: ProviderConfigCache['data'] = {
      allowedCountryCodes: { buy: {}, sell: {} },
      allowedCurrencyCodes: {
        buy: {
          sepa: { providerId: pluginId, fiat: {}, crypto: {} }
        },
        sell: {
          sepa: { providerId: pluginId, fiat: {}, crypto: {} }
        }
      }
    }

    // Fetch all three endpoints in parallel
    const dfxBlockchains = Object.keys(DFX_BLOCKCHAIN_MAP).join(',')
    const [fiatsRes, assetsRes, countriesRes] = await Promise.all([
      fetch(`${apiUrl}/v1/fiat`).catch(() => undefined),
      fetch(`${apiUrl}/v1/asset?blockchains=${dfxBlockchains}`).catch(
        () => undefined
      ),
      fetch(`${apiUrl}/v1/country`).catch(() => undefined)
    ])

    // Process fiats
    if (fiatsRes?.ok === true) {
      const fiats = asDfxFiats(await fiatsRes.json())
      for (const fiat of fiats) {
        const isoCode = `iso:${fiat.name.toUpperCase()}`

        for (const dir of ['buy', 'sell'] as FiatDirection[]) {
          if (dir === 'buy' && !fiat.buyable) continue
          if (dir === 'sell' && !fiat.sellable) continue

          for (const pt in freshConfig.allowedCurrencyCodes[dir]) {
            const assetMap =
              freshConfig.allowedCurrencyCodes[dir][pt as FiatPaymentType]
            if (assetMap != null) {
              assetMap.fiat[isoCode] = fiat
            }
          }
        }
      }
    }

    // Process crypto assets
    if (assetsRes?.ok === true) {
      const assets = asDfxAssets(await assetsRes.json())
      for (const asset of assets) {
        const edgePluginId = DFX_BLOCKCHAIN_MAP[asset.blockchain]
        if (edgePluginId == null) continue

        let tokenId: EdgeTokenId
        // DFX returns wrapped-token contract addresses even for native coins
        // (e.g. WETH for ETH). Detect native coins by name match.
        const nativeCoinName = DFX_NATIVE_COIN_NAMES[asset.blockchain]

        if (asset.name === nativeCoinName) {
          // Native coin for this blockchain
          tokenId = null
        } else if (asset.chainId != null) {
          // Token with contract address
          const resolved = findTokenIdByNetworkLocation({
            account,
            pluginId: edgePluginId,
            networkLocation: { contractAddress: asset.chainId }
          })
          if (resolved === undefined) continue
          tokenId = resolved
        } else {
          // No contract address and not native coin — skip
          continue
        }

        for (const dir of ['buy', 'sell'] as FiatDirection[]) {
          if (dir === 'buy' && !asset.buyable) continue
          if (dir === 'sell' && !asset.sellable) continue

          for (const pt in freshConfig.allowedCurrencyCodes[dir]) {
            const assetMap =
              freshConfig.allowedCurrencyCodes[dir][pt as FiatPaymentType]
            if (assetMap != null) {
              assetMap.crypto[edgePluginId] ??= []
              addTokenToArray(
                { tokenId, otherInfo: asset },
                assetMap.crypto[edgePluginId]
              )
            }
          }
        }
      }
    }

    // Process countries
    if (countriesRes?.ok === true) {
      const countries = asDfxCountries(await countriesRes.json())
      for (const country of countries) {
        if (BLOCKED_COUNTRIES.has(country.symbol)) continue
        if (country.locationAllowed !== true) continue

        if (country.bankAllowed === true) {
          addExactRegion(freshConfig.allowedCountryCodes.buy, country.symbol)
          addExactRegion(freshConfig.allowedCountryCodes.sell, country.symbol)
        }
      }
    }

    providerCache = { data: freshConfig, timestamp: Date.now() }
    return freshConfig
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const isRegionSupported = (
    regionCode: FiatPluginRegionCode,
    direction: FiatDirection,
    allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions>
  ): boolean => {
    try {
      validateExactRegion(pluginId, regionCode, allowedCountryCodes[direction])
      return true
    } catch {
      return false
    }
  }

  const isCryptoSupported = (
    cryptoPluginId: string,
    tokenId: EdgeTokenId,
    assetMap: AssetMap
  ): ProviderToken | null => {
    const tokens = assetMap.crypto[cryptoPluginId]
    if (tokens == null) return null
    return tokens.find(t => t.tokenId === tokenId) ?? null
  }

  const isFiatSupported = (
    fiatCurrencyCode: string,
    assetMap: AssetMap
  ): DfxFiat | null => {
    return assetMap.fiat[fiatCurrencyCode] ?? null
  }

  const ensureIsoPrefix = (code: string): string =>
    code.startsWith('iso:') ? code : `iso:${code}`

  // Prefer segwit/transparent addresses where available
  const getBestAddress = async (
    wallet: EdgeCurrencyWallet
  ): Promise<string> => {
    const addresses = await wallet.getAddresses({ tokenId: null })
    if (addresses.length === 0) {
      throw new Error('Wallet has no addresses')
    }
    const getPriority = (type: string | undefined): number => {
      if (type === 'segwitAddress' || type === 'transparentAddress') return 1
      return 2
    }
    addresses.sort(
      (a, b) => getPriority(a.addressType) - getPriority(b.addressType)
    )
    return addresses[0].publicAddress
  }

  const getSupportedPaymentMethods = (
    direction: FiatDirection,
    allowedCurrencyCodes: ProviderConfigCache['data']['allowedCurrencyCodes']
  ): Array<{
    paymentType: FiatPaymentType
    dfxPaymentMethod: DfxPaymentMethod
    assetMap: AssetMap
  }> => {
    const methods: Array<{
      paymentType: FiatPaymentType
      dfxPaymentMethod: DfxPaymentMethod
      assetMap: AssetMap
    }> = []

    for (const pt in allowedCurrencyCodes[direction]) {
      const paymentType = pt as FiatPaymentType
      const assetMap = allowedCurrencyCodes[direction][paymentType]
      if (assetMap == null) continue

      // Reverse lookup DFX payment method
      const dfxMethod = Object.entries(DFX_PAYMENT_TYPE_MAP).find(
        ([, v]) => v === paymentType
      )
      if (dfxMethod == null) continue

      methods.push({
        paymentType,
        dfxPaymentMethod: dfxMethod[0] as DfxPaymentMethod,
        assetMap
      })
    }
    return methods
  }

  // -----------------------------------------------------------------------
  // KYC handler
  // -----------------------------------------------------------------------

  const handleKycRequired = async (
    wallet: EdgeCurrencyWallet,
    direction: FiatDirection = 'buy'
  ): Promise<void> => {
    let token: string
    try {
      token = await getDfxAuth(wallet)
    } catch {
      showToast(lstrings.ramp_kyc_error_title, NOT_SUCCESS_TOAST_HIDE_MS)
      return
    }
    const redirectUrl = encodeURIComponent(
      `https://deep.edge.app/ramp/${direction}/${pluginId}`
    )
    await openExternalWebView({
      url: `${webAppUrl}/kyc?session=${token}&kyc-redirect=${redirectUrl}`,
      deeplink: {
        direction,
        providerId: pluginId,
        handler: async _link => {
          showToast(
            lstrings.ramp_kyc_approved_message,
            NOT_SUCCESS_TOAST_HIDE_MS
          )
        }
      }
    })
  }

  // -----------------------------------------------------------------------
  // Plugin
  // -----------------------------------------------------------------------

  const plugin: RampPlugin = {
    pluginId,
    rampInfo,

    checkSupport: async (
      request: RampCheckSupportRequest
    ): Promise<RampSupportResult> => {
      const {
        direction,
        regionCode,
        fiatAsset: { currencyCode: fiatCurrencyCode },
        cryptoAsset: { pluginId: cryptoPluginId, tokenId }
      } = request

      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes } = config

      const supportedMethods = getSupportedPaymentMethods(
        direction,
        allowedCurrencyCodes
      )
      if (supportedMethods.length === 0) return { supported: false }

      const paymentTypes = supportedMethods.map(m => m.paymentType)
      const constraintOk = validateRampCheckSupportRequest(
        pluginId,
        request,
        paymentTypes
      )
      if (!constraintOk) return { supported: false }

      if (!isRegionSupported(regionCode, direction, allowedCountryCodes)) {
        return { supported: false }
      }

      for (const { assetMap } of supportedMethods) {
        if (isCryptoSupported(cryptoPluginId, tokenId, assetMap) == null)
          continue
        if (
          isFiatSupported(ensureIsoPrefix(fiatCurrencyCode), assetMap) == null
        )
          continue
        return { supported: true, supportedAmountTypes: ['fiat', 'crypto'] }
      }

      return { supported: false }
    },

    fetchQuotes: async (request: RampQuoteRequest): Promise<RampQuote[]> => {
      const { direction, regionCode, displayCurrencyCode, tokenId } = request
      const fiatCurrencyCode = ensureIsoPrefix(request.fiatCurrencyCode)

      const isMaxAmount =
        'max' in request.amountQuery ||
        'maxExchangeAmount' in request.amountQuery
      const exchangeAmountString =
        'exchangeAmount' in request.amountQuery
          ? request.amountQuery.exchangeAmount
          : ''
      const maxAmountLimitString =
        'maxExchangeAmount' in request.amountQuery
          ? request.amountQuery.maxExchangeAmount
          : undefined

      const config = await fetchProviderConfig()
      const { allowedCountryCodes, allowedCurrencyCodes } = config

      if (!isRegionSupported(regionCode, direction, allowedCountryCodes)) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'regionRestricted'
        })
      }

      const supportedMethods = getSupportedPaymentMethods(
        direction,
        allowedCurrencyCodes
      )
      if (supportedMethods.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'paymentUnsupported'
        })
      }

      // Build candidates
      const candidates: Array<{
        paymentType: FiatPaymentType
        dfxPaymentMethod: DfxPaymentMethod
        assetMap: AssetMap
        cryptoToken: ProviderToken
        fiatObj: DfxFiat
      }> = []

      for (const method of supportedMethods) {
        const cryptoToken = isCryptoSupported(
          request.wallet.currencyInfo.pluginId,
          request.tokenId,
          method.assetMap
        )
        if (cryptoToken == null) continue

        const fiatObj = isFiatSupported(fiatCurrencyCode, method.assetMap)
        if (fiatObj == null) continue

        if (!validateRampQuoteRequest(pluginId, request, method.paymentType))
          continue

        candidates.push({
          paymentType: method.paymentType,
          dfxPaymentMethod: method.dfxPaymentMethod,
          assetMap: method.assetMap,
          cryptoToken,
          fiatObj
        })
      }

      if (candidates.length === 0) {
        throw new FiatProviderError({
          providerId: pluginId,
          errorType: 'assetUnsupported'
        })
      }

      const displayFiatCurrencyCode = removeIsoPrefix(fiatCurrencyCode)

      const quotes: RampQuote[] = []
      const errors: unknown[] = []

      for (const candidate of candidates) {
        const { paymentType, dfxPaymentMethod, cryptoToken, fiatObj } =
          candidate
        try {
          const dfxAsset = cryptoToken.otherInfo as DfxAsset

          // Determine the DFX blockchain name for this asset
          const dfxBlockchain =
            EDGE_TO_DFX_BLOCKCHAIN[request.wallet.currencyInfo.pluginId]
          if (dfxBlockchain == null) continue

          // Build quote request body — DFX API expects object references
          const endpoint = direction === 'buy' ? 'buy/quote' : 'sell/quote'
          const quoteBody: DfxQuoteBody = {
            currency: { id: fiatObj.id },
            asset: { id: dfxAsset.id, blockchain: dfxAsset.blockchain },
            paymentMethod: dfxPaymentMethod
          }

          // Determine amount
          let exchangeAmount: number
          if (isMaxAmount) {
            // For max, we'll request a quote with a high amount and use the
            // returned maxVolume
            exchangeAmount = 999999
            const maxAmountLimit =
              maxAmountLimitString != null
                ? parseFloat(maxAmountLimitString)
                : undefined
            if (maxAmountLimit != null && isFinite(maxAmountLimit)) {
              exchangeAmount = maxAmountLimit
            }
          } else {
            exchangeAmount = parseFloat(exchangeAmountString)
          }

          // DFX API: amount = source currency, targetAmount = target currency
          // Buy:  source = fiat,   target = crypto
          // Sell: source = crypto, target = fiat
          if (direction === 'buy') {
            if (request.amountType === 'fiat') quoteBody.amount = exchangeAmount
            else quoteBody.targetAmount = exchangeAmount
          } else {
            if (request.amountType === 'crypto')
              quoteBody.amount = exchangeAmount
            else quoteBody.targetAmount = exchangeAmount
          }

          const quoteResponse = await fetch(`${apiUrl}/v1/${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteBody)
          }).catch(() => undefined)

          if (quoteResponse == null) continue
          if (quoteResponse.status === 403) {
            await handleKycRequired(request.wallet, direction)
            continue
          }
          if (!quoteResponse.ok) continue

          const dfxQuote = asDfxQuote(await quoteResponse.json())

          // Check for KYC error
          if (dfxQuote.error?.toLowerCase().includes('kyc') === true) {
            await handleKycRequired(request.wallet, direction)
            continue
          }

          const minSource = dfxQuote.minVolume
          const maxSource = dfxQuote.maxVolume

          // Handle max amount requests
          if (isMaxAmount) {
            exchangeAmount = maxSource * 0.98

            const maxAmountLimit =
              maxAmountLimitString != null
                ? parseFloat(maxAmountLimitString)
                : undefined
            if (maxAmountLimit != null && isFinite(maxAmountLimit)) {
              exchangeAmount = Math.min(exchangeAmount, maxAmountLimit)
            }

            if (exchangeAmount < minSource) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'underLimit',
                errorAmount: minSource,
                displayCurrencyCode:
                  direction === 'buy'
                    ? displayFiatCurrencyCode
                    : displayCurrencyCode
              })
            }

            // Re-fetch quote with correct amount
            quoteBody.amount = exchangeAmount
            quoteBody.targetAmount = undefined
            const reQuoteResponse = await fetch(`${apiUrl}/v1/${endpoint}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(quoteBody)
            }).catch(() => undefined)

            if (reQuoteResponse?.ok !== true) continue

            const reQuote = asDfxQuote(await reQuoteResponse.json())
            Object.assign(dfxQuote, reQuote)
          }

          // Limit checks for non-max requests
          // minVolume/maxVolume are in source currency (fiat for buy, crypto for sell)
          if (!isMaxAmount) {
            let sourceAmount: number
            if (direction === 'buy') {
              sourceAmount =
                request.amountType === 'fiat'
                  ? exchangeAmount
                  : dfxQuote.amount ?? exchangeAmount
            } else {
              sourceAmount =
                request.amountType === 'crypto'
                  ? exchangeAmount
                  : dfxQuote.amount ?? exchangeAmount
            }
            const limitDisplayCode =
              direction === 'buy'
                ? displayFiatCurrencyCode
                : displayCurrencyCode
            if (sourceAmount > maxSource) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'overLimit',
                errorAmount: maxSource,
                displayCurrencyCode: limitDisplayCode
              })
            }
            if (sourceAmount < minSource) {
              throw new FiatProviderError({
                providerId: pluginId,
                errorType: 'underLimit',
                errorAmount: minSource,
                displayCurrencyCode: limitDisplayCode
              })
            }
          }

          // Calculate amounts
          // DFX API: `amount` = source currency, `estimatedAmount` = target asset
          // Buy:  source = fiat,   target = crypto
          // Sell: source = crypto, target = fiat
          let fiatAmount: string
          let cryptoAmount: string

          if (direction === 'buy') {
            if (request.amountType === 'fiat') {
              fiatAmount = exchangeAmount.toString()
              cryptoAmount = dfxQuote.estimatedAmount.toString()
            } else {
              cryptoAmount = exchangeAmount.toString()
              fiatAmount = dfxQuote.amount?.toString() ?? '0'
            }
          } else {
            if (request.amountType === 'fiat') {
              fiatAmount = exchangeAmount.toString()
              cryptoAmount = dfxQuote.amount?.toString() ?? '0'
            } else {
              cryptoAmount = exchangeAmount.toString()
              fiatAmount = dfxQuote.estimatedAmount.toString()
            }
          }

          const settlementRange = getSettlementRange(
            paymentType,
            request.direction
          )
          const settlementDays = formatSettlementDays(settlementRange)

          const quote: RampQuote = {
            pluginId,
            partnerIcon,
            pluginDisplayName,
            displayCurrencyCode: request.displayCurrencyCode,
            isEstimate: true,
            fiatCurrencyCode,
            fiatAmount,
            cryptoAmount,
            direction: request.direction,
            expirationDate: new Date(Date.now() + 60000),
            regionCode,
            paymentType,
            settlementRange,
            approveQuote: async (
              approveParams: RampApproveQuoteParams
            ): Promise<void> => {
              const { coreWallet } = approveParams

              if (direction === 'buy' && dfxPaymentMethod === 'Bank') {
                // -----------------------------------------------------------
                // BUY via SEPA — native InfoDisplayScene
                // -----------------------------------------------------------
                const token = await getDfxAuth(coreWallet)

                const receiveAddress = await getBestAddress(coreWallet)

                const paymentInfoBody = {
                  currency: { id: fiatObj.id },
                  asset: {
                    id: dfxAsset.id,
                    blockchain: dfxAsset.blockchain
                  },
                  amount: parseFloat(fiatAmount),
                  paymentMethod: 'Bank',
                  targetAddress: receiveAddress
                }

                const piResponse = await showToastSpinner(
                  lstrings.fiat_plugin_finalizing_quote,
                  fetch(`${apiUrl}/v1/buy/paymentInfos`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(paymentInfoBody)
                  })
                )

                if (piResponse.status === 403) {
                  await handleKycRequired(coreWallet, 'buy')
                  return
                }
                if (!piResponse.ok) {
                  const errBody = await piResponse.text()
                  throw new Error(
                    `DFX buy paymentInfos failed: ${piResponse.status} ${errBody}`
                  )
                }

                const piJson = await piResponse.json()
                const paymentInfo = asDfxBuyPaymentInfo(piJson)

                if (paymentInfo.isValid === false) {
                  const kycErrors = new Set([
                    'LimitExceeded',
                    'KycRequired',
                    'KycDataRequired',
                    'KycRequiredInstant'
                  ])
                  if (
                    paymentInfo.error != null &&
                    kycErrors.has(paymentInfo.error)
                  ) {
                    await handleKycRequired(coreWallet, 'buy')
                    return
                  }
                  throw new Error(`DFX: ${paymentInfo.error ?? 'Unknown'}`)
                }

                const piCurrency =
                  paymentInfo.currency?.name ?? displayFiatCurrencyCode

                const transferInfo: FiatPluginSepaTransferInfo = {
                  input: {
                    amount: `${paymentInfo.amount} ${piCurrency}`,
                    currency: piCurrency
                  },
                  output: {
                    amount: cryptoAmount,
                    currency: displayCurrencyCode,
                    walletAddress: receiveAddress
                  },
                  paymentDetails: {
                    id: paymentInfo.uid,
                    iban: paymentInfo.iban ?? '',
                    swiftBic: paymentInfo.bic ?? '',
                    recipient: 'DFX AG',
                    reference: paymentInfo.remittanceInfo ?? ''
                  }
                }

                await new Promise<void>((resolve, _reject) => {
                  navigation.navigate('guiPluginInfoDisplay', {
                    headerTitle: lstrings.fiat_plugin_buy_complete_title,
                    supportUrl: `${webAppUrl}/support/issue?session=${token}`,
                    promptMessage: sprintf(
                      lstrings.fiat_plugin_buy_complete_message_s,
                      cryptoAmount,
                      displayCurrencyCode,
                      fiatAmount,
                      displayFiatCurrencyCode,
                      settlementDays
                    ),
                    transferInfo,
                    onDone: async () => {
                      // Check if user has email registered
                      try {
                        const userRes = await fetch(`${apiUrl}/v2/user`, {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        })
                        if (userRes.ok) {
                          const user = await userRes.json()
                          if (user.mail == null) {
                            const email = await Airship.show<
                              string | undefined
                            >(bridge =>
                              React.createElement(TextInputModal, {
                                bridge,
                                title: lstrings.form_field_title_email_address,
                                message:
                                  lstrings.ramp_kyc_email_required_message,
                                inputLabel:
                                  lstrings.form_field_title_email_address,
                                keyboardType: 'email-address' as const,
                                autoCapitalize: 'none' as const,
                                autoCorrect: false,
                                returnKeyType: 'go' as const,
                                onSubmit: async (text: string) => {
                                  const emailRegex =
                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                  if (!emailRegex.test(text)) {
                                    return lstrings.invalid_email
                                  }
                                  return true
                                }
                              })
                            )
                            if (email != null) {
                              const mailRes = await fetch(
                                `${apiUrl}/v2/user/mail`,
                                {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ mail: email })
                                }
                              )
                              if (!mailRes.ok) {
                                const errBody = await mailRes
                                  .json()
                                  .catch(() => ({}))
                                showError(
                                  errBody.message ??
                                    `Failed to set email: ${mailRes.status}`
                                )
                              }
                            }
                          }
                        }
                      } catch (e: unknown) {
                        showError(e)
                      }

                      // Confirm the buy order with DFX
                      try {
                        await fetch(
                          `${apiUrl}/v1/buy/paymentInfos/${paymentInfo.id}/confirm`,
                          {
                            method: 'PUT',
                            headers: {
                              Authorization: `Bearer ${token}`
                            }
                          }
                        )
                      } catch (e: unknown) {
                        showError(e)
                      }

                      onLogEvent('Buy_Success', {
                        conversionValues: {
                          conversionType: 'buy',
                          sourceFiatCurrencyCode: fiatCurrencyCode,
                          sourceFiatAmount: fiatAmount,
                          destAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            tokenId,
                            exchangeAmount: cryptoAmount
                          }),
                          fiatProviderId: pluginId,
                          orderId: paymentInfo.uid
                        }
                      })
                      navigation.pop()
                      resolve()
                    }
                  })
                })
              } else if (direction === 'sell') {
                // -----------------------------------------------------------
                // SELL via SEPA — SendScene2
                // -----------------------------------------------------------

                // Collect user's SEPA bank details and process sell
                navigation.navigate('guiPluginSepaForm', {
                  headerTitle: lstrings.sepa_form_title,
                  doneLabel: lstrings.string_next_capitalized,
                  onDone: async (sepaInfo: SepaInfo) => {
                    const token = await getDfxAuth(coreWallet)

                    const senderAddress = await getBestAddress(coreWallet)

                    const sellBody = {
                      currency: { id: fiatObj.id },
                      asset: {
                        id: dfxAsset.id,
                        blockchain: dfxAsset.blockchain
                      },
                      amount: parseFloat(cryptoAmount),
                      paymentMethod: 'Bank',
                      sourceAddress: senderAddress,
                      iban: sepaInfo.iban
                    }

                    const sellResponse = await fetch(
                      `${apiUrl}/v1/sell/paymentInfos?includeTx=true`,
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(sellBody)
                      }
                    )

                    if (sellResponse.status === 403) {
                      await handleKycRequired(coreWallet, 'sell')
                      return
                    }
                    if (!sellResponse.ok) {
                      const errBody = await sellResponse.text()
                      throw new Error(
                        `DFX sell paymentInfos failed: ${sellResponse.status} ${errBody}`
                      )
                    }

                    const sellInfo = asDfxSellPaymentInfo(
                      await sellResponse.json()
                    )

                    if (sellInfo.isValid === false) {
                      const kycErrors = new Set([
                        'LimitExceeded',
                        'KycRequired',
                        'KycDataRequired',
                        'KycRequiredInstant'
                      ])
                      if (
                        sellInfo.error != null &&
                        kycErrors.has(sellInfo.error)
                      ) {
                        await handleKycRequired(coreWallet, 'sell')
                        return
                      }
                      throw new Error(`DFX: ${sellInfo.error ?? 'Unknown'}`)
                    }

                    const { multiplier } = getExchangeDenom(
                      coreWallet.currencyConfig,
                      tokenId
                    )
                    const nativeAmount = mul(
                      sellInfo.amount.toString(),
                      multiplier
                    )

                    const assetAction: EdgeAssetAction = {
                      assetActionType: 'sell'
                    }
                    const savedAction: EdgeTxActionFiat = {
                      actionType: 'fiat',
                      orderId: sellInfo.uid,
                      orderUri: `${webAppUrl}/tx/${sellInfo.uid}`,
                      isEstimate: true,
                      fiatPlugin: {
                        providerId: pluginId,
                        providerDisplayName: pluginDisplayName,
                        supportEmail
                      },
                      payinAddress: sellInfo.depositAddress,
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
                          publicAddress: sellInfo.depositAddress
                        }
                      ]
                    }

                    const sendParams: SendScene2Params = {
                      walletId: coreWallet.id,
                      tokenId,
                      spendInfo,
                      dismissAlert: true,
                      lockTilesMap: {
                        address: true,
                        amount: true,
                        wallet: true
                      },
                      hiddenFeaturesMap: {
                        address: true
                      },
                      onDone: async (error, tx): Promise<void> => {
                        if (error != null) {
                          throw error
                        }
                        if (tx == null) {
                          throw new Error(SendErrorNoTransaction)
                        }

                        // Confirm TX hash with DFX
                        try {
                          await fetch(
                            `${apiUrl}/v1/sell/paymentInfos/${sellInfo.id}/confirm`,
                            {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ txHash: tx.txid })
                            }
                          )
                        } catch (e: unknown) {
                          showError(e)
                        }

                        onLogEvent('Sell_Success', {
                          conversionValues: {
                            conversionType: 'sell',
                            destFiatCurrencyCode: fiatCurrencyCode,
                            destFiatAmount: fiatAmount,
                            sourceAmount: new CryptoAmount({
                              currencyConfig: coreWallet.currencyConfig,
                              tokenId,
                              exchangeAmount: cryptoAmount
                            }),
                            fiatProviderId: pluginId,
                            orderId: sellInfo.uid
                          }
                        })

                        if (tokenId != null) {
                          await coreWallet.saveTxAction({
                            txid: tx.txid,
                            tokenId,
                            assetAction: {
                              ...assetAction,
                              assetActionType: 'sell'
                            },
                            savedAction
                          })
                        }

                        // Pop both send2 and SEPA form screens
                        navigation.pop(2)

                        const message =
                          sprintf(
                            lstrings.fiat_plugin_sell_complete_message_s,
                            cryptoAmount,
                            displayCurrencyCode,
                            fiatAmount,
                            displayFiatCurrencyCode,
                            settlementDays
                          ) +
                          '\n\n' +
                          sprintf(
                            lstrings.fiat_plugin_sell_complete_message_2_hour_s,
                            '24'
                          ) +
                          '\n\n' +
                          lstrings.fiat_plugin_sell_complete_message_3

                        await showButtonsModal({
                          buttons: {
                            ok: {
                              label: lstrings.string_ok,
                              type: 'primary'
                            }
                          },
                          title: lstrings.fiat_plugin_sell_complete_title,
                          message
                        })
                      },
                      onBack: () => {
                        // User backed out of send
                      }
                    }

                    try {
                      navigation.navigate('send2', sendParams)
                    } catch (e: unknown) {
                      if (
                        e instanceof Error &&
                        e.message === SendErrorBackPressed
                      ) {
                        // User pressed back
                      } else if (
                        e instanceof Error &&
                        e.message === SendErrorNoTransaction
                      ) {
                        showToast(
                          lstrings.fiat_plugin_sell_failed_to_send_try_again,
                          NOT_SUCCESS_TOAST_HIDE_MS
                        )
                      } else {
                        showError(e)
                      }
                    }
                  },
                  onClose: () => {
                    // User cancelled
                  }
                })
              }
            },
            closeQuote: async (): Promise<void> => {}
          }

          quotes.push(quote)
        } catch (e) {
          errors.push(e)
        }
      }

      if (quotes.length === 0 && errors.length > 0) {
        throw new AggregateError(errors, 'All DFX quotes failed')
      }

      return quotes
    }
  }

  return plugin
}
