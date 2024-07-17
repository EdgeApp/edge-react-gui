import { div } from 'biggystring'
import { asNumber, asObject, asOptional, asString, asUnknown, asValue } from 'cleaners'
import { EdgeAssetAction, EdgeSpendInfo, EdgeTxActionFiat } from 'edge-core-js'
import { toUtf8Bytes } from 'ethers/lib/utils'

import { SendScene2Params } from '../../../components/scenes/SendScene2'
import { showError } from '../../../components/services/AirshipInstance'
import { ENV } from '../../../env'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { hexToDecimal, removeIsoPrefix } from '../../../util/utils'
import { FiatDirection, FiatPaymentType, SaveTxActionParams } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { FiatPluginOpenWebViewParams } from '../scenes/FiatPluginWebView'

const GWEI = '1000000000'

const providerId = 'mtpelerin'
const storeId = 'com.mtpelerin'
const partnerIcon = 'mtpelerin.png'
const pluginDisplayName = 'Mt Pelerin'
const providerDisplayName = pluginDisplayName
const supportEmail = 'support@mtpelerin.com'

const urls = {
  api: {
    prod: 'https://api.mtpelerin.com',
    test: 'https://api.mtpelerin.com'
  },
  widget: {
    prod: 'https://widget.mtpelerin.com',
    test: 'https://widget-staging.mtpelerin.com'
  }
}

const MODE = ENV.ENABLE_FIAT_SANDBOX ? 'test' : 'prod'

const PLUGIN_TO_CHAIN_ID_MAP: { [pluginId: string]: string } = {
  arbitrum: 'arbitrum_mainnet',
  avalanche: 'avalanche_mainnet',
  binancesmartchain: 'bsc_mainnet',
  bitcoin: 'bitcoin_mainnet',
  ethereum: 'mainnet',
  optimism: 'optimism_mainnet',
  polygon: 'matic_mainnet',
  rsk: 'rsk_mainnet',

  // Tezos plugin cannot sign messages so we can't use it
  // tezos: 'tezos_mainnet',
  zksync: 'zksync_mainnet'
}

const BUY_ONLY_PLUGIN_IDS: { [pluginId: string]: boolean } = {}

const PLUGIN_EVM_MAP: { [pluginId: string]: boolean } = {
  arbitrum: true,
  avalanche: true,
  binancesmartchain: true,
  ethereum: true,
  optimism: true,
  polygon: true,
  rsk: true,
  zksync: true
}

if (MODE === 'test') {
  delete PLUGIN_TO_CHAIN_ID_MAP.ethereum
  PLUGIN_TO_CHAIN_ID_MAP.goerli = 'mainnet'
  PLUGIN_EVM_MAP.goerli = true
}

const CHAIN_ID_TO_PLUGIN_MAP: { [chainId: string]: string } = Object.entries(PLUGIN_TO_CHAIN_ID_MAP).reduce(
  (out: { [chainId: string]: string }, [pluginId, chainId]) => {
    out[chainId] = pluginId
    return out
  },
  {}
)

type AllowedPaymentTypes = Record<FiatDirection, { [Payment in FiatPaymentType]?: boolean }>

const allowedPaymentTypes: AllowedPaymentTypes = {
  buy: {
    fasterpayments: true,
    sepa: true
  },
  sell: {
    fasterpayments: true,
    sepa: true
  }
}

const allAllowedCurrencyCodes: Record<FiatDirection, FiatProviderAssetMap> = {
  buy: {
    providerId,
    crypto: {},
    fiat: {
      CHF: true,
      DKK: true,
      EUR: true,
      GBP: true,
      HKD: true,
      JPY: true,
      NOK: true,
      NZD: true,
      SEK: true,
      SGD: true,
      USD: true,
      ZAR: true
    }
  },
  sell: {
    providerId,
    crypto: {},
    fiat: {
      CHF: true,
      DKK: true,
      EUR: true,
      GBP: true,
      HKD: true,
      JPY: true,
      NOK: true,
      NZD: true,
      SEK: true,
      SGD: true,
      USD: true,
      ZAR: true
    }
  }
}
const allowedCountryCodes: { [code: string]: boolean } = {
  AL: true, // Albania
  AD: true, // Andorra
  AM: true, // Armenia
  AT: true, // Austria
  AZ: true, // Azerbaijan
  BY: true, // Belarus
  BE: true, // Belgium
  BA: true, // Bosnia and Herzegovina
  BG: true, // Bulgaria
  HR: true, // Croatia
  CY: true, // Cyprus
  CZ: true, // Czech Republic
  DK: true, // Denmark
  EE: true, // Estonia
  FI: true, // Finland
  FR: true, // France
  GE: true, // Georgia
  DE: true, // Germany
  GR: true, // Greece
  HU: true, // Hungary
  IS: true, // Iceland
  IE: true, // Ireland
  IT: true, // Italy
  KZ: true, // Kazakhstan
  LV: true, // Latvia
  LI: true, // Liechtenstein
  LT: true, // Lithuania
  LU: true, // Luxembourg
  MT: true, // Malta
  MD: true, // Moldova
  MC: true, // Monaco
  ME: true, // Montenegro
  NL: true, // Netherlands
  MK: true, // North Macedonia (formerly Macedonia)
  NO: true, // Norway
  PL: true, // Poland
  PT: true, // Portugal
  RO: true, // Romania
  RU: true, // Russia
  SM: true, // San Marino
  RS: true, // Serbia
  SK: true, // Slovakia
  SI: true, // Slovenia
  ES: true, // Spain
  SE: true, // Sweden
  CH: true, // Switzerland
  TR: true, // Turkey
  UA: true, // Ukraine
  GB: true, // United Kingdom
  VA: true // Vatican City
}

/**
 * Cleaner for https://api.mtpelerin.com/currencies/tokens
 */

// Define a cleaner for the individual token entry
const asTokenEntry = asObject({
  symbol: asString,
  network: asString,
  // decimals: asNumber,
  address: asString
  // isStable: asBoolean,
  // networkFee: asOptional(asNumber),
  // forceNetworkFee: asOptional(asBoolean)
})

// Define a cleaner for the entire JSON structure
const asTokenList = asObject(asTokenEntry)

const asTokenOtherInfo = asObject({
  address: asString,
  symbol: asString
})

// Define a cleaner for the 'fees' object
const asFees = asObject({
  networkFee: asString, // Assuming network fee can be a string representation of a number
  fixFee: asNumber
})

// Define the main cleaner for the entire JSON structure
const asQuoteResponse = asObject({
  fees: asFees,
  sourceCurrency: asString,
  destCurrency: asString,
  sourceNetwork: asString,
  destNetwork: asString,
  sourceAmount: asString,
  destAmount: asString // Assuming dest amount can be a string representation of a number
})

const asSendTransactionParams = asObject({
  chainId: asOptional(asNumber),
  to: asString,
  nonce: asOptional(asString),
  gasPrice: asOptional(asString),
  gasLimit: asOptional(asString),
  amount: asOptional(asString),
  value: asOptional(asString),
  from: asOptional(asString)
})

// Define the expected structure of the entire object
const asMessage = asObject({
  request: asValue('getAddresses', 'sendTransaction', 'signPersonalMessage'),
  params: asUnknown
})

interface GetSourceQuoteParams {
  sourceAmount: number
}

interface GetDestQuoteParams {
  destAmount: number
}

type GetQuoteParams = (GetSourceQuoteParams | GetDestQuoteParams) & {
  sourceCurrency: string
  sourceNetwork: string
  destCurrency: string
  destNetwork: string
  isCardPayment: false
}

type WidgetParams = (WidgetBuyParams | WidgetSellParams) & {
  _ctkn: string
  lang?: string /** 2 characters language code ('fr'|'en') */
  primary?: string /** Primary color (hexadecimal encoded) */
  addr: string /** Wallet address */
  code: string /** Random 4 digit code from 1000-9999 */
  hash: string /** Hash of signature */
  net: string /** Default network */
  type: 'webview' /** Integration type ('web'|'popup'|'webview') */
}

interface WidgetBuySourceParams {
  bsa: string /** Default buy tab source amount */
}

interface WidgetBuyDestParams {
  bda: string /** Default buy tab destination amount */
}

type WidgetBuyParams = (WidgetBuySourceParams | WidgetBuyDestParams) & {
  tab: 'buy' /** Tab displayed by default ('buy'|'sell) */
  bsc: string /** Default buy tab source currency */
  bdc: string /** Default buy tab destination currency */
}

interface WidgetSellSourceParams {
  ssa: string /** Default sell tab source amount */
}
interface WidgetSellDestParams {
  sda: string /** Default sell tab source amount */
}
type WidgetSellParams = (WidgetSellSourceParams | WidgetSellDestParams) & {
  tab: 'sell' /** Tab displayed by default ('buy'|'sell) */
  ssc: string /** Default sell tab source currency */
  sdc: string /** Default sell tab destination currency */
}

export const mtpelerinProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const apiKey = asString(params.apiKeys)
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        const allowedCurrencyCodes = allAllowedCurrencyCodes[direction]

        if (Object.keys(allowedCurrencyCodes.crypto).length > 0) {
          return allowedCurrencyCodes
        }

        const response = await fetch(`${urls.api[MODE]}/currencies/tokens`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching My Pelerin currencies: ${text}`)
        }
        const result = await response.json()

        const tokenList = asTokenList(result)

        for (const token of Object.values(tokenList)) {
          const { address, network, symbol } = token
          const pluginId = CHAIN_ID_TO_PLUGIN_MAP[network]
          if (BUY_ONLY_PLUGIN_IDS[pluginId] && direction === 'sell') continue

          if (pluginId == null) continue
          if (allowedCurrencyCodes.crypto[pluginId] == null) {
            allowedCurrencyCodes.crypto[pluginId] = []
          }
          const tokens = allowedCurrencyCodes.crypto[pluginId]

          // Check if gas token (ie ETH, BTC)
          if (address.includes('0000000000000000000000000000000000000000')) {
            tokens.push({ tokenId: null, otherInfo: { address, symbol } })

            if (MODE === 'test' && network === 'mainnet') {
              if (allowedCurrencyCodes.crypto.goerli == null) {
                allowedCurrencyCodes.crypto.goerli = []
              }
              allowedCurrencyCodes.crypto.goerli.push({ tokenId: null, otherInfo: { address, symbol } })
            }

            continue
          }

          // For EVM tokens only, lowercase and remove 0x
          const tokenId = address.toLowerCase().replace('0x', '')
          tokens.push({ tokenId, otherInfo: { address, symbol } })
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { amountType, direction, regionCode, exchangeAmount, fiatCurrencyCode, paymentTypes, pluginId, displayCurrencyCode, tokenId } = params
        if (BUY_ONLY_PLUGIN_IDS[pluginId] && direction === 'sell') throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })

        const allowedCurrencyCodes = allAllowedCurrencyCodes[direction]

        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[direction][paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const tokens = allowedCurrencyCodes.crypto[pluginId]
        const token = tokens.find(t => t.tokenId === tokenId)
        if (token == null) throw new FiatProviderError({ providerId, errorType: 'assetUnsupported' })
        const { symbol } = asTokenOtherInfo(token.otherInfo)
        const network = PLUGIN_TO_CHAIN_ID_MAP[pluginId]

        // Query for a quote
        let getQuoteParams: GetQuoteParams
        const fiatCode = removeIsoPrefix(fiatCurrencyCode)

        if (direction === 'buy') {
          if (amountType === 'fiat') {
            getQuoteParams = {
              sourceAmount: Number(exchangeAmount),
              sourceCurrency: fiatCode,
              sourceNetwork: 'fiat',
              destCurrency: symbol,
              destNetwork: network,
              isCardPayment: false
            }
          } else {
            getQuoteParams = {
              sourceCurrency: fiatCode,
              sourceNetwork: 'fiat',
              destAmount: Number(exchangeAmount),
              destCurrency: symbol,
              destNetwork: network,
              isCardPayment: false
            }
          }
        } else {
          if (amountType === 'crypto') {
            getQuoteParams = {
              sourceAmount: Number(exchangeAmount),
              sourceCurrency: symbol,
              sourceNetwork: network,
              destCurrency: fiatCode,
              destNetwork: 'fiat',
              isCardPayment: false
            }
          } else {
            getQuoteParams = {
              sourceCurrency: symbol,
              sourceNetwork: network,
              destAmount: Number(exchangeAmount),
              destCurrency: fiatCode,
              destNetwork: 'fiat',
              isCardPayment: false
            }
          }
        }

        const response = await fetch(`${urls.api[MODE]}/currency_rates/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(getQuoteParams)
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Error fetching Mt Pelerin quote: ${text}`)
        }
        const result = await response.json()
        const quote = asQuoteResponse(result)

        const { destAmount, sourceAmount } = quote

        let fiatAmount: string
        let cryptoAmount: string
        if (direction === 'buy') {
          fiatAmount = sourceAmount
          cryptoAmount = destAmount
        } else {
          fiatAmount = destAmount
          cryptoAmount = sourceAmount
        }

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: true,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          cryptoAmount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 60000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { coreWallet, showUi } = approveParams
            const { publicAddress } = await coreWallet.getReceiveAddress({ tokenId })

            const getAddress = async (): Promise<string> => {
              return publicAddress
            }

            const sendResponse = (eventName: string, response: unknown, injecteJs: (js: string) => void): void => {
              const run = `
                          window.wallet._response('${eventName}', ${JSON.stringify(response)});
                          true;
                          `
              injecteJs(run)
            }

            const onMessage: FiatPluginOpenWebViewParams['onMessage'] = (eventMessage: string, injectJs) => {
              const message = asMessage(JSON.parse(eventMessage))
              try {
                switch (message.request) {
                  case 'getAddresses': {
                    getAddress()
                      .then(address => {
                        sendResponse('onaddresses', [address], injectJs)
                      })
                      .catch(e => {
                        throw e
                      })
                    break
                  }
                  case 'signPersonalMessage': {
                    throw new Error('signPersonalMessage not supported')
                    // We sign the message before launching the webview. This shouldn't get
                    // called

                    // coreWallet
                    //   .signMessage(message.params)
                    //   .then(response => {
                    //     sendResponse('onsignedpersonalmessage', response, injectJs)
                    //   })
                    //   .catch(e => {
                    //     throw e
                    //   })
                    // break
                  }
                  case 'sendTransaction': {
                    const send = async (): Promise<void> => {
                      const { gasLimit: hexGasLimit, gasPrice: hexGasPrice, to, amount, value: valueHex } = asSendTransactionParams(message.params)

                      let nativeAmount: string
                      if (amount != null) {
                        nativeAmount = amount
                      } else if (valueHex != null) {
                        nativeAmount = hexToDecimal(valueHex)
                      } else {
                        throw new Error('MtPelerin: Missing amount or value')
                      }

                      // XXX don't have an orderId or orderUri
                      const orderId = 'mtpelerin_no_orderid'
                      const orderUri = 'https://mtpelerin.com'

                      const exchangeAmount = await coreWallet.nativeToDenomination(nativeAmount, params.displayCurrencyCode)

                      const assetAction: EdgeAssetAction = {
                        assetActionType: 'sell'
                      }
                      const savedAction: EdgeTxActionFiat = {
                        actionType: 'fiat',
                        orderId,
                        orderUri,
                        isEstimate: true,
                        fiatPlugin: {
                          providerId,
                          providerDisplayName,
                          supportEmail
                        },
                        payinAddress: to,
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

                      // Launch the SendScene to make payment
                      const spendInfo: EdgeSpendInfo = {
                        tokenId,
                        assetAction,
                        savedAction,
                        spendTargets: [
                          {
                            nativeAmount,
                            publicAddress: to
                          }
                        ]
                      }

                      let gasLimit: string | undefined
                      let gasPrice: string | undefined

                      if (hexGasLimit != null && hexGasPrice != null) {
                        gasLimit = hexToDecimal(hexGasLimit)
                        gasPrice = div(hexToDecimal(hexGasPrice), GWEI)
                        spendInfo.networkFeeOption = 'custom'
                        spendInfo.customNetworkFee = {
                          networkFeeOption: 'custom',
                          customNetworkFee: {
                            gasLimit,
                            gasPrice
                          }
                        }
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
                      const tx = await showUi.send(sendParams)
                      await showUi.trackConversion('Sell_Success', {
                        conversionValues: {
                          conversionType: 'sell',
                          destFiatCurrencyCode: fiatCurrencyCode,
                          destFiatAmount: fiatAmount,
                          sourceAmount: new CryptoAmount({
                            currencyConfig: coreWallet.currencyConfig,
                            currencyCode: displayCurrencyCode,
                            exchangeAmount: exchangeAmount
                          }),
                          fiatProviderId: providerId,
                          orderId
                        }
                      })

                      // Save separate metadata/action for token transaction fee
                      if (tokenId != null) {
                        const params: SaveTxActionParams = {
                          walletId: coreWallet.id,
                          tokenId,
                          txid: tx.txid,
                          savedAction,
                          assetAction: { ...assetAction, assetActionType: 'sell' }
                        }
                        await showUi.saveTxAction(params)
                      }

                      sendResponse('onsenttransaction', tx.signedTx, injectJs)
                    }
                    send().catch(e => {
                      if (!e.message.includes('SendErrorBackPressed')) {
                        showError(e)
                      }
                    })
                    break
                  }
                  default:
                    break
                }
              } catch (e) {}
            }

            // Does not need to be cryptographically secure
            const code = String(Math.floor(Math.random() * 9000) + 1000)
            const message = 'MtPelerin-' + code
            let hash: string

            if (PLUGIN_EVM_MAP[pluginId]) {
              // EVM based chains require a hex message to be signed
              const utf8Message = toUtf8Bytes(message)
              const hexMessage = Buffer.from(utf8Message).toString('hex')
              const signature = await coreWallet.signMessage(hexMessage)
              hash = Buffer.from(signature.replace('0x', ''), 'hex').toString('base64')
            } else {
              hash = await coreWallet.signMessage(message, { otherParams: { publicAddress } })
            }

            let widgetParams: WidgetParams
            const commonParams = {
              _ctkn: apiKey,
              addr: publicAddress,
              code,
              hash,
              net: network,
              type: 'webview' as 'webview'
            }

            if (direction === 'buy') {
              if (amountType === 'fiat') {
                widgetParams = {
                  ...commonParams,
                  tab: 'buy',
                  bsc: fiatCode,
                  bdc: symbol,
                  bsa: exchangeAmount
                }
              } else {
                widgetParams = {
                  ...commonParams,
                  tab: 'buy',
                  bsc: fiatCode,
                  bdc: symbol,
                  bda: exchangeAmount
                }
              }
            } else {
              if (amountType === 'fiat') {
                widgetParams = {
                  ...commonParams,
                  tab: 'sell',
                  ssc: symbol,
                  sdc: fiatCode,
                  sda: exchangeAmount
                }
              } else {
                widgetParams = {
                  ...commonParams,
                  tab: 'sell',
                  ssc: symbol,
                  sdc: fiatCode,
                  ssa: exchangeAmount
                }
              }
            }
            const url = `${urls.widget[MODE]}/?${encodeQuery(widgetParams)}` + (MODE === 'test' ? '&env=development' : '')

            await showUi.openWebView({
              url,
              injectedJs,
              onMessage,
              onClose: () => {}
            })
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      },
      otherMethods: null
    }
    return out
  }
}

// Below is from the react-native-mtp-onofframp repo
// https://gitlab.com/mtpelerin/react-native-mtp-onofframp/-/blob/main/index.js?ref_type=heads

const encodeQuery = (data: WidgetParams): string => {
  let query = ''
  Object.entries(data).forEach(([key, value]) => {
    query += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`
  })
  return query.slice(0, -1)
}

const defaultInjectedBeforePageLoad = `
window.wallet = {
  _listeners: {},
  _request: (request, params, eventName) => {
    return new Promise((resolve, reject) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({request, params}));
      if (!window.wallet._listeners[request]) {
        window.wallet._listeners[request] = window.addEventListener(eventName, (e) => {
          window.removeEventListener(eventName, window.wallet._listeners[request]);
          window.wallet._listeners[request] = null;
          resolve(e.detail.response);
        });
      }
    });
  },
  _response: (event, response) => {
    window.dispatchEvent(new CustomEvent(event, {
      detail: {
        response
      }
    }));
  },
  getAddresses: () => {
    return window.wallet._request('getAddresses', null, 'onaddresses');
  },
  signPersonalMessage: (params) => {
    return window.wallet._request('signPersonalMessage', params, 'onsignedpersonalmessage');
  },
  sendTransaction: (rawTx) => {
    return window.wallet._request('sendTransaction', rawTx, 'onsenttransaction');
  },
}

console.log('Injected wallet');
`

const injectedJs = defaultInjectedBeforePageLoad + '\ntrue;'
