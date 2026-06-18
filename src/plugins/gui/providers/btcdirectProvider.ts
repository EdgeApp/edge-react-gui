import { div } from 'biggystring'
import type { EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showError } from '../../../components/services/AirshipInstance'
import { lstrings } from '../../../locales/strings'
import type { FiatProviderLink } from '../../../types/DeepLinkTypes'
import { CryptoAmount } from '../../../util/CryptoAmount'
import type { FiatPaymentType } from '../fiatPluginTypes'
import {
  type FiatProvider,
  type FiatProviderApproveQuoteParams,
  type FiatProviderAssetMap,
  FiatProviderError,
  type FiatProviderExactRegions,
  type FiatProviderFactory,
  type FiatProviderFactoryParams,
  type FiatProviderGetQuoteParams,
  type FiatProviderGetSupportedAssetsParams,
  type FiatProviderGetTokenId,
  type FiatProviderQuote
} from '../fiatProviderTypes'
import {
  createBtcDirectCheckout,
  fetchBtcDirectPrices
} from '../util/fetchBtcDirect'
import { validateExactRegion } from './common'

const providerId = 'btcdirect'
const partnerIcon = 'btcdirect.png'
const pluginDisplayName = 'BTC Direct'

// BTC Direct currently quotes against EUR only.
const FIAT_CURRENCY_CODE = 'iso:EUR'
const QUOTE_CURRENCY = 'EUR'

// BTC Direct base-currency code -> Edge native asset. Token assets are omitted
// until BTC Direct exposes contract addresses we can map to Edge tokenIds.
const BTC_DIRECT_NATIVE_ASSETS: Record<
  string,
  { pluginId: string; currencyCode: string }
> = {
  BTC: { pluginId: 'bitcoin', currencyCode: 'BTC' },
  ETH: { pluginId: 'ethereum', currencyCode: 'ETH' },
  LTC: { pluginId: 'litecoin', currencyCode: 'LTC' },
  XRP: { pluginId: 'ripple', currencyCode: 'XRP' },
  SOL: { pluginId: 'solana', currencyCode: 'SOL' },
  BCH: { pluginId: 'bitcoincash', currencyCode: 'BCH' },
  ADA: { pluginId: 'cardano', currencyCode: 'ADA' },
  DOGE: { pluginId: 'dogecoin', currencyCode: 'DOGE' },
  ALGO: { pluginId: 'algorand', currencyCode: 'ALGO' },
  XLM: { pluginId: 'stellar', currencyCode: 'XLM' },
  TRX: { pluginId: 'tron', currencyCode: 'TRX' },
  AVAX: { pluginId: 'avalanche', currencyCode: 'AVAX' },
  POL: { pluginId: 'polygon', currencyCode: 'POL' },
  ETC: { pluginId: 'ethereumclassic', currencyCode: 'ETC' },
  BNB: { pluginId: 'binancesmartchain', currencyCode: 'BNB' },
  HBAR: { pluginId: 'hedera', currencyCode: 'HBAR' }
}

// Edge pluginId -> BTC Direct base-currency code (reverse of the map above).
const EDGE_PLUGIN_ID_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(BTC_DIRECT_NATIVE_ASSETS).map(([code, asset]) => [
    asset.pluginId,
    code
  ])
)

// Edge payment type -> BTC Direct payment method code.
const PAYMENT_METHOD_MAP: Partial<Record<FiatPaymentType, string>> = {
  credit: 'creditCard',
  ideal: 'iDeal',
  sepa: 'sepa'
}

// BTC Direct serves EU / EEA customers (EUR only).
const allowedCountryCodes: FiatProviderExactRegions = {
  AT: true,
  BE: true,
  BG: true,
  HR: true,
  CY: true,
  CZ: true,
  DK: true,
  EE: true,
  FI: true,
  FR: true,
  DE: true,
  GR: true,
  HU: true,
  IE: true,
  IT: true,
  LV: true,
  LI: true,
  LT: true,
  LU: true,
  MT: true,
  NL: true,
  NO: true,
  PL: true,
  PT: true,
  RO: true,
  SK: true,
  SI: true,
  ES: true,
  SE: true
}

const RETURN_URL = `https://return.edge.app/fiatprovider/buy/${providerId}?transactionStatus=success`

export const btcdirectProvider: FiatProviderFactory = {
  providerId,
  storeId: providerId,
  makeProvider: async (
    params: FiatProviderFactoryParams
  ): Promise<FiatProvider> => {
    const { getTokenId } = params

    const provider: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async (
        params: FiatProviderGetSupportedAssetsParams
      ): Promise<FiatProviderAssetMap> => {
        const paymentType = params.paymentTypes[0]
        const assetMap: FiatProviderAssetMap = {
          providerId,
          crypto: {},
          fiat: {},
          requiredAmountType: 'fiat'
        }

        // BTC Direct only supports buying with the payment methods we map.
        if (
          params.direction !== 'buy' ||
          PAYMENT_METHOD_MAP[paymentType] == null
        ) {
          return assetMap
        }
        validateExactRegion(providerId, params.regionCode, allowedCountryCodes)

        const prices = await fetchBtcDirectPrices()
        for (const pair of Object.values(prices)) {
          if (pair == null || pair.targetCurrency.code !== QUOTE_CURRENCY) {
            continue
          }
          const asset = getEdgeAsset(getTokenId, pair.sourceCurrency.code)
          if (asset == null) continue
          assetMap.crypto[asset.pluginId] = [{ tokenId: asset.tokenId }]
        }
        assetMap.fiat[FIAT_CURRENCY_CODE] = true

        return assetMap
      },
      getQuote: async (
        params: FiatProviderGetQuoteParams
      ): Promise<FiatProviderQuote> => {
        const paymentType = params.paymentTypes[0]
        const paymentMethod = PAYMENT_METHOD_MAP[paymentType]

        if (params.direction !== 'buy' || paymentMethod == null) {
          throw new FiatProviderError({
            providerId,
            errorType: 'paymentUnsupported'
          })
        }
        if (params.fiatCurrencyCode !== FIAT_CURRENCY_CODE) {
          throw new FiatProviderError({
            providerId,
            errorType: 'fiatUnsupported',
            fiatCurrencyCode: params.fiatCurrencyCode,
            paymentMethod,
            pluginDisplayName
          })
        }
        validateExactRegion(providerId, params.regionCode, allowedCountryCodes)

        const baseCurrency = EDGE_PLUGIN_ID_TO_CODE[params.pluginId]
        if (baseCurrency == null || params.tokenId != null) {
          throw new FiatProviderError({
            providerId,
            errorType: 'assetUnsupported'
          })
        }

        const prices = await fetchBtcDirectPrices()
        const pair = prices[`${baseCurrency}-${QUOTE_CURRENCY}`]
        if (pair == null) {
          throw new FiatProviderError({
            providerId,
            errorType: 'assetUnsupported'
          })
        }

        // BTC Direct requires the user to enter the fiat amount. The final
        // crypto amount is locked in on the BTC Direct checkout page, so this
        // quote is an estimate derived from the current buy price.
        const decimals = pair.sourceCurrency.decimals ?? 8
        const fiatAmount = params.exchangeAmount
        const cryptoAmount = div(fiatAmount, pair.buy.toString(), decimals)

        return {
          providerId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          cryptoAmount,
          isEstimate: true,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 1000 * 60),
          regionCode: params.regionCode,
          paymentTypes: params.paymentTypes,

          approveQuote: async (
            approveParams: FiatProviderApproveQuoteParams
          ): Promise<void> => {
            const { showUi, coreWallet } = approveParams
            const walletAddresses = await coreWallet.getAddresses({
              tokenId: params.tokenId
            })
            const walletAddress = walletAddresses[0]?.publicAddress
            if (walletAddress == null) {
              throw new Error('No wallet address found')
            }

            const { checkoutUrl } = await createBtcDirectCheckout({
              baseCurrency,
              quoteCurrency: QUOTE_CURRENCY,
              paymentMethod,
              walletAddress,
              quoteCurrencyAmount: parseFloat(fiatAmount),
              returnUrl: RETURN_URL
            })

            const deeplinkHandlerAsync = async (
              link: FiatProviderLink
            ): Promise<void> => {
              await showUi.trackConversion('Buy_Success', {
                conversionValues: {
                  conversionType: 'buy',
                  sourceFiatCurrencyCode: params.fiatCurrencyCode,
                  sourceFiatAmount: fiatAmount,
                  destAmount: new CryptoAmount({
                    currencyConfig: coreWallet.currencyConfig,
                    tokenId: params.tokenId,
                    exchangeAmount: cryptoAmount
                  }),
                  fiatProviderId: providerId,
                  orderId: link.query.partnerOrderIdentifier ?? undefined
                }
              })
              const message =
                sprintf(
                  lstrings.fiat_plugin_buy_complete_message_s,
                  cryptoAmount,
                  params.displayCurrencyCode,
                  fiatAmount,
                  params.fiatCurrencyCode,
                  '1'
                ) +
                '\n\n' +
                sprintf(
                  lstrings.fiat_plugin_buy_complete_message_2_hour_s,
                  '1'
                ) +
                '\n\n' +
                lstrings.fiat_plugin_sell_complete_message_3
              await showUi.buttonModal({
                buttons: {
                  ok: { label: lstrings.string_ok, type: 'primary' }
                },
                title: lstrings.fiat_plugin_buy_complete_title,
                message
              })
            }

            await showUi.openExternalWebView({
              url: checkoutUrl,
              providerId,
              deeplinkHandler: link => {
                deeplinkHandlerAsync(link).catch((error: unknown) => {
                  showError(error)
                })
              }
            })
          },
          closeQuote: async (): Promise<void> => {}
        }
      },
      otherMethods: null
    }

    return provider
  }
}

function getEdgeAsset(
  getTokenId: FiatProviderGetTokenId,
  btcDirectCode: string
): { pluginId: string; tokenId: EdgeTokenId } | undefined {
  const asset = BTC_DIRECT_NATIVE_ASSETS[btcDirectCode]
  if (asset == null) return undefined

  const tokenId = getTokenId(asset.pluginId, asset.currencyCode)
  // `undefined` means this asset is not present in the current Edge build.
  if (tokenId === undefined) return undefined

  return { pluginId: asset.pluginId, tokenId }
}
