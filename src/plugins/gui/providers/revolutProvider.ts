import { asMaybe } from 'cleaners'
import { EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../locales/strings'
import { CryptoAmount } from '../../../util/CryptoAmount'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderGetSupportedAssetsParams,
  FiatProviderGetTokenIdFromContract,
  FiatProviderQuote
} from '../fiatProviderTypes'
import {
  asRevolutCrypto,
  asRevolutFiat,
  fetchRevolutConfig,
  fetchRevolutQuote,
  fetchRevolutRedirectUrl,
  RevolutConfig,
  RevolutCrypto,
  RevolutFiat
} from '../util/fetchRevolut'
import { makeCheckDue } from './common'
import { ProviderSupportStore } from './ProviderSupportStore'

const providerId = 'revolut'
const partnerIcon = 'revolut.png'
const pluginDisplayName = 'Revolut'

export const revolutProvider: FiatProviderFactory = {
  providerId,
  storeId: providerId,
  makeProvider: async (
    params: FiatProviderFactoryParams
  ): Promise<FiatProvider> => {
    const { getTokenIdFromContract, io } = params
    const isCheckDue = makeCheckDue(1000 * 60 * 60) // 1 hour

    const supportedAssets = new ProviderSupportStore(providerId)
    supportedAssets.add.direction('buy')

    const provider: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async (
        params: FiatProviderGetSupportedAssetsParams
      ): Promise<FiatProviderAssetMap> => {
        const region =
          params.regionCode.stateProvinceCode == null
            ? params.regionCode.countryCode
            : `${params.regionCode.countryCode}:${params.regionCode.stateProvinceCode}`

        if (isCheckDue()) {
          const configData = await fetchRevolutConfig()
          processRevolutConfig(
            configData,
            getTokenIdFromContract,
            supportedAssets
          )
        }

        const assetMap = supportedAssets.getFiatProviderAssetMap({
          direction: params.direction,
          region,
          payment: params.paymentTypes[0]
        })

        return { ...assetMap, requiredAmountType: 'fiat' }
      },
      getQuote: async (
        params: FiatProviderGetQuoteParams
      ): Promise<FiatProviderQuote> => {
        const fiatKey = params.fiatCurrencyCode
        const revolutFiat = asMaybe(asRevolutFiat)(
          supportedAssets.getFiatInfo(fiatKey)
        )
        const cryptoKey = `${params.pluginId}:${params.tokenId}`
        const revolutCrypto = asMaybe(asRevolutCrypto)(
          supportedAssets.getCryptoInfo(cryptoKey)
        )

        if (!supportedAssets.is.direction(params.direction).supported) {
          throw new FiatProviderError({
            providerId,
            errorType: 'paymentUnsupported'
          })
        }

        if (revolutFiat == null) {
          throw new Error(`Revolut fiat not found: ${fiatKey}`)
        }
        if (revolutCrypto == null) {
          throw new Error(`Revolut crypto not found: ${cryptoKey}`)
        }

        const quoteData = await fetchRevolutQuote({
          fiat: revolutFiat.currency,
          amount: params.exchangeAmount,
          crypto: revolutCrypto.id,
          payment: 'revolut', // Only revolut is supported at the moment
          region: params.regionCode.countryCode
        })

        const cryptoAmount = quoteData.crypto.amount.toString()
        const fiatAmount = params.exchangeAmount

        // Assume 1 minute expiration:
        const expirationDate = new Date(Date.now() + 1000 * 60)

        return {
          providerId,
          partnerIcon,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          cryptoAmount,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          direction: params.direction,
          expirationDate,
          regionCode: params.regionCode,
          paymentTypes: params.paymentTypes,

          approveQuote: async (
            approveParams: FiatProviderApproveQuoteParams
          ) => {
            const { showUi, coreWallet } = approveParams
            const walletAddresses = await coreWallet.getAddresses({
              tokenId: params.tokenId
            })
            const walletAddress = walletAddresses[0]?.publicAddress

            if (walletAddress == null) {
              throw new Error('No wallet address found')
            }

            const successReturnURL = encodeURIComponent(
              'https://return.edge.app/fiatprovider/buy/revolut?transactionStatus=success'
            )

            const orderId = await io.makeUuid()

            const { ramp_redirect_url: redirectUrl } =
              await fetchRevolutRedirectUrl({
                fiat: revolutFiat.currency,
                amount: parseFloat(fiatAmount),
                crypto: quoteData.crypto.currencyId,
                payment: 'revolut',
                region: params.regionCode.countryCode,
                wallet: walletAddress,
                partnerRedirectUrl: successReturnURL,
                orderId
              })

            await showUi.openExternalWebView({
              url: redirectUrl,
              providerId,
              async deeplinkHandler(link) {
                if (link.direction === 'sell') {
                  throw new FiatProviderError({
                    providerId,
                    errorType: 'paymentUnsupported'
                  })
                }
                const { transactionStatus } = link.query
                if (transactionStatus === 'success') {
                  await showUi.trackConversion('Buy_Success', {
                    conversionValues: {
                      conversionType: 'buy',
                      sourceFiatCurrencyCode: params.fiatCurrencyCode,
                      sourceFiatAmount: fiatAmount,
                      destAmount: new CryptoAmount({
                        currencyConfig: coreWallet.currencyConfig,
                        currencyCode: params.displayCurrencyCode,
                        exchangeAmount: cryptoAmount
                      }),
                      fiatProviderId: providerId,
                      orderId
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
                } else {
                  throw new Error(
                    `Unexpected return link status: ${transactionStatus}`
                  )
                }
              }
            })
          },
          closeQuote: async () => {}
        }
      },
      otherMethods: null
    }

    return provider
  }
}

function addRevolutCrypto(
  supportedAssets: ProviderSupportStore,
  getTokenIdFromContract: FiatProviderGetTokenIdFromContract,
  crypto: RevolutCrypto
): void {
  let pluginId: string | undefined
  let tokenId: EdgeTokenId | undefined

  switch (crypto.blockchain) {
    case 'ALGORAND':
    case 'AVALANCHE':
    case 'BITCOIN':
    case 'BITCOINCASH':
    case 'CARDANO':
    case 'DOGECOIN':
    case 'ETHEREUM':
    case 'LITECOIN':
    case 'OPTIMISM':
    case 'POLKADOT':
    case 'POLYGON':
    case 'RIPPLE':
    case 'SOLANA':
    case 'STELLAR':
    case 'TEZOS':
    case 'TRON':
      pluginId = crypto.blockchain.toLowerCase()
      break
    default:
      console.warn(`Unknown blockchain from Revolut: ${crypto.blockchain}`)
      return
  }
  if (crypto.smartContractAddress != null) {
    tokenId = getTokenIdFromContract({
      pluginId,
      contractAddress: crypto.smartContractAddress
    })
  } else {
    switch (crypto.currency) {
      case 'ADA':
      case 'ALGO':
      case 'AVAX':
      case 'BCH':
      case 'BTC':
      case 'DOGE':
      case 'DOT':
      case 'ETH':
      case 'LTC':
      case 'POL':
      case 'SOL':
      case 'XLM':
      case 'XRP':
      case 'XTZ':
        tokenId = null
    }
  }
  if (tokenId === undefined) {
    console.warn(`Unknown crypto currency from Revolut: ${crypto.currency}`)
    return
  }

  const cryptoKey = `${pluginId}:${tokenId}`
  supportedAssets.add
    .direction('*')
    .region('*')
    .fiat('*')
    .payment('*')
    .crypto(cryptoKey)
  supportedAssets.addCryptoInfo(cryptoKey, crypto)
}

function addRevolutPaymentMethod(
  supportedAssets: ProviderSupportStore,
  method: string
): void {
  switch (method) {
    case 'revolut':
      supportedAssets.add
        .direction('*')
        .region('*')
        .fiat('*')
        .payment('revolut')
      return
    case 'card':
    case 'apple-pay':
    case 'google-pay':
      // Intentionally not supported
      return
    default:
      console.warn(`Unknown payment method from Revolut: ${method}`)
  }
}

function addRevolutFiat(
  supportedAssets: ProviderSupportStore,
  fiat: RevolutFiat
) {
  const fiatKey = `iso:${fiat.currency}`
  supportedAssets.add.direction('*').region('*').fiat(fiatKey).payment('*')
  supportedAssets.addFiatInfo(fiatKey, fiat)
}

export function processRevolutConfig(
  configData: RevolutConfig,
  getTokenIdFromContract: FiatProviderGetTokenIdFromContract,
  supportedAssets: ProviderSupportStore
) {
  configData.countries.forEach(country => {
    supportedAssets.add.direction('*').region(country).fiat('*').payment('*')
  })
  configData.fiat.forEach(fiat => {
    addRevolutFiat(supportedAssets, fiat)
  })
  configData.crypto.forEach(crypto => {
    addRevolutCrypto(supportedAssets, getTokenIdFromContract, crypto)
  })
  configData.payment_methods.forEach(method => {
    addRevolutPaymentMethod(supportedAssets, method)
  })
}
