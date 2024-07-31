// import { div, gt, lt, mul, toFixed } from 'biggystring'
import { asArray, asBoolean, asEither, asNull, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import URL from 'url-parse'

import { StringMap } from '../../../types/types'
import { removeIsoPrefix } from '../../../util/utils'
import { asFiatPaymentType, FiatDirection, FiatPaymentType } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderExactRegions,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderGetTokenId,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { addTokenToArray } from '../util/providerUtils'
import { addExactRegion, isDailyCheckDue, validateExactRegion } from './common'
const providerId = 'moonpay'
const storeId = 'com.moonpay'
const partnerIcon = 'moonpay_symbol_prp.png'
const pluginDisplayName = 'Moonpay'

const allowedCurrencyCodes: FiatProviderAssetMap = { providerId, crypto: {}, fiat: {} }
const allowedCountryCodes: Record<FiatDirection, FiatProviderExactRegions> = { buy: {}, sell: {} }
const allowedPaymentTypes: { [Payment in FiatPaymentType]?: boolean } = { applepay: true, credit: true, googlepay: true, iach: true }

const asMoonpayCurrency = asObject({
  type: asValue('crypto', 'fiat'),
  code: asString,
  name: asString,
  maxAmount: asEither(asNumber, asNull),
  minAmount: asEither(asNumber, asNull),
  maxBuyAmount: asEither(asNumber, asNull),
  minBuyAmount: asEither(asNumber, asNull),
  isSuspended: asOptional(asBoolean),
  isSupportedInUS: asOptional(asBoolean)
})
export type MoonpayCurrency = ReturnType<typeof asMoonpayCurrency>

const asMoonpayCurrencies = asArray(asMoonpayCurrency)

const asMoonpayQuote = asObject({
  baseCurrencyCode: asString,
  baseCurrencyAmount: asNumber,
  quoteCurrencyCode: asString,
  quoteCurrencyAmount: asNumber,
  quoteCurrencyPrice: asNumber,
  feeAmount: asNumber,
  extraFeeAmount: asNumber,
  extraFeePercentage: asNumber,
  networkFeeAmount: asNumber,
  totalAmount: asNumber
})

const asState = asObject({
  code: asString,
  // "name": "Alabama",
  isBuyAllowed: asBoolean,
  // "isNftAllowed": true,
  isSellAllowed: asBoolean,
  // "isBalanceLedgerWithdrawAllowed": true,
  isAllowed: asBoolean
  // "isFiatBalanceAllowed": false
})

const asMoonpayCountry = asObject({
  alpha2: asString,
  isAllowed: asBoolean,
  isBuyAllowed: asBoolean,
  isSellAllowed: asBoolean,
  states: asOptional(asArray(asState))
})

const asApiKeys = asString

const asMoonpayCountries = asArray(asMoonpayCountry)

interface MoonpayWidgetQueryParams {
  apiKey: string
  currencyCode: string
  baseCurrencyCode: string
  lockAmount: boolean
  walletAddress: string
  showAllCurrencies: boolean
  enableRecurringBuys: boolean
  paymentMethod: 'ach_bank_transfer' | 'credit_debit_card'
  quoteCurrencyAmount?: number
  baseCurrencyAmount?: number
}

const CURRENCY_CODE_TRANSLATE: StringMap = {
  matic_polygon: 'matic'
}

const CURRENCY_PLUGINID_MAP: StringMap = {
  bch: 'bitcoincash',
  bnb: 'binancechain',
  btc: 'bitcoin',
  celo: 'celo',
  dash: 'dash',
  dgb: 'digibyte',
  doge: 'dogecoin',
  dot: 'polkadot',
  eos: 'eos',
  etc: 'ethereumclassic',
  eth: 'ethereum',
  hbar: 'hedera',
  ltc: 'litecoin',
  matic: 'polygon',
  qtum: 'qtum',
  rvn: 'ravencoin',
  sol: 'solana',
  xlm: 'stellar',
  xrp: 'ripple',
  xtz: 'tezos'
}

const TOKEN_MAP: StringMap = {
  bat: 'ethereum',
  comp: 'ethereum',
  dai: 'ethereum',
  tusd: 'ethereum',
  zrx: 'ethereum'
}
let lastChecked = 0

export const moonpayProvider: FiatProviderFactory = {
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys, getTokenId } = params
    const apiKey = asApiKeys(apiKeys)
    if (apiKey == null) throw new Error('Moonpay missing apiKey')
    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ direction, paymentTypes, regionCode }): Promise<FiatProviderAssetMap> => {
        if (direction !== 'buy') {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }
        // Return nothing if paymentTypes are not supported by this provider
        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        if (isDailyCheckDue(lastChecked)) {
          const response = await fetch(`https://api.moonpay.com/v3/currencies?apiKey=${apiKey}`).catch(e => undefined)
          if (response == null || !response.ok) return allowedCurrencyCodes

          const result = await response.json()
          let moonpayCurrencies: MoonpayCurrency[] = []
          try {
            moonpayCurrencies = asMoonpayCurrencies(result)
          } catch (error: any) {
            console.log(error.message)
            console.log(JSON.stringify(error, null, 2))
            return allowedCurrencyCodes
          }
          for (const currency of moonpayCurrencies) {
            if (currency.type === 'crypto') {
              if (regionCode.countryCode === 'US' && currency.isSupportedInUS !== true) {
                continue
              }
              if (currency.name.includes('(ERC-20)')) {
                addToAllowedCurrencies(getTokenId, 'ethereum', currency, currency.code)
              } else {
                if (currency.isSuspended) continue
                if (CURRENCY_CODE_TRANSLATE[currency.code] != null) {
                  const currencyCode = CURRENCY_CODE_TRANSLATE[currency.code]
                  addToAllowedCurrencies(getTokenId, CURRENCY_PLUGINID_MAP[currencyCode], currency, currencyCode)
                  currency.code = CURRENCY_CODE_TRANSLATE[currency.code]
                } else if (TOKEN_MAP[currency.code] != null) {
                  addToAllowedCurrencies(getTokenId, TOKEN_MAP[currency.code], currency, currency.code)
                }
                if (CURRENCY_PLUGINID_MAP[currency.code] != null) {
                  addToAllowedCurrencies(getTokenId, CURRENCY_PLUGINID_MAP[currency.code], currency, currency.code)
                }
              }
            } else {
              allowedCurrencyCodes.fiat['iso:' + currency.code.toUpperCase()] = currency
            }
          }

          const response2 = await fetch(`https://api.moonpay.com/v3/countries?apiKey=${apiKey}`).catch(e => undefined)
          if (response2 == null || !response2.ok) throw new Error('Moonpay failed to fetch countries')

          const result2 = await response2.json()
          const countries = asMoonpayCountries(result2)
          for (const country of countries) {
            if (country.isAllowed) {
              if (country.states == null) {
                if (country.isBuyAllowed) {
                  allowedCountryCodes.buy[country.alpha2] = true
                } else if (country.isSellAllowed) {
                  allowedCountryCodes.sell[country.alpha2] = true
                }
              } else {
                const countryCode = country.alpha2
                // Validate state support
                for (const state of country.states) {
                  if (state.isAllowed) {
                    const stateProvinceCode = state.code

                    if (state.isBuyAllowed) {
                      addExactRegion(allowedCountryCodes.buy, countryCode, stateProvinceCode)
                    }
                    if (state.isSellAllowed) {
                      addExactRegion(allowedCountryCodes.sell, countryCode, stateProvinceCode)
                    }
                  }
                }
              }
            }
          }
          lastChecked = Date.now()
        }
        validateExactRegion(providerId, regionCode, allowedCountryCodes[direction])
        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const { direction, regionCode, paymentTypes, displayCurrencyCode } = params
        validateExactRegion(providerId, regionCode, allowedCountryCodes[direction])
        if (direction !== 'buy') {
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        }

        if (!paymentTypes.some(paymentType => allowedPaymentTypes[paymentType] === true))
          throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })
        let foundPaymentType = false
        let useIAch = false
        for (const type of paymentTypes) {
          const t = asFiatPaymentType(type)
          if (allowedPaymentTypes[t]) {
            foundPaymentType = true
          }
          if (type === 'iach') {
            useIAch = true
          }
        }
        if (!foundPaymentType) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        let amountParam = ''
        const tokens = allowedCurrencyCodes.crypto[params.pluginId]
        const moonpayCurrency = tokens.find(token => token.tokenId === params.tokenId)
        const cryptoCurrencyObj = asMoonpayCurrency(moonpayCurrency?.otherInfo)
        const fiatCurrencyObj = asMoonpayCurrency(allowedCurrencyCodes.fiat[params.fiatCurrencyCode])
        if (cryptoCurrencyObj == null || fiatCurrencyObj == null) throw new Error('Moonpay could not query supported currencies')

        const maxFiat = Math.max(fiatCurrencyObj.maxAmount ?? 0, fiatCurrencyObj.maxBuyAmount ?? 0)
        const minFiat = Math.min(fiatCurrencyObj.minAmount ?? Infinity, fiatCurrencyObj.minBuyAmount ?? Infinity)
        const maxCrypto = Math.max(cryptoCurrencyObj.maxAmount ?? 0, cryptoCurrencyObj.maxBuyAmount ?? 0)
        const minCrypto = Math.min(cryptoCurrencyObj.minAmount ?? Infinity, cryptoCurrencyObj.minBuyAmount ?? Infinity)
        const exchangeAmount = parseFloat(params.exchangeAmount)
        const displayFiatCurrencyCode = removeIsoPrefix(params.fiatCurrencyCode)
        if (params.amountType === 'fiat') {
          if (exchangeAmount > maxFiat)
            throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: maxFiat, displayCurrencyCode: displayFiatCurrencyCode })
          if (exchangeAmount < minFiat)
            throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: minFiat, displayCurrencyCode: displayFiatCurrencyCode })
          // User typed a fiat amount. Need a crypto value
          amountParam = `baseCurrencyAmount=${params.exchangeAmount}`
        } else {
          if (exchangeAmount > maxCrypto) throw new FiatProviderError({ providerId, errorType: 'overLimit', errorAmount: maxCrypto, displayCurrencyCode })
          if (exchangeAmount < minCrypto) throw new FiatProviderError({ providerId, errorType: 'underLimit', errorAmount: minCrypto, displayCurrencyCode })
          amountParam = `quoteCurrencyAmount=${params.exchangeAmount}`
        }

        const fiatCode = removeIsoPrefix(params.fiatCurrencyCode).toLowerCase()
        const paymentMethod = useIAch ? 'ach_bank_transfer' : 'credit_debit_card'
        const url = `https://api.moonpay.com/v3/currencies/${cryptoCurrencyObj.code}/buy_quote/?apiKey=${apiKey}&quoteCurrencyCode=${cryptoCurrencyObj.code}&baseCurrencyCode=${fiatCode}&paymentMethod=${paymentMethod}&areFeesIncluded=true&${amountParam}`
        const response = await fetch(url).catch(e => {
          console.log(e)
          return undefined
        })

        if (response == null || !response.ok) {
          throw new Error('Moonpay failed to fetch quote')
        }

        const result = await response.json()
        const moonpayQuote = asMoonpayQuote(result)

        console.log('Got Moonpay quote')
        console.log(JSON.stringify(moonpayQuote, null, 2))

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: moonpayQuote.totalAmount.toString(),
          cryptoAmount: moonpayQuote.quoteCurrencyAmount.toString(),
          direction: params.direction,
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { coreWallet, showUi } = approveParams
            const receiveAddress = await coreWallet.getReceiveAddress({ tokenId: null })
            const url = new URL('https://buy.moonpay.com?', true)
            const queryObj: MoonpayWidgetQueryParams = {
              apiKey,
              walletAddress: receiveAddress.publicAddress,
              currencyCode: cryptoCurrencyObj.code,
              paymentMethod,
              baseCurrencyCode: fiatCurrencyObj.code,
              lockAmount: true,
              showAllCurrencies: false,
              enableRecurringBuys: true
            }
            if (params.amountType === 'crypto') {
              queryObj.quoteCurrencyAmount = moonpayQuote.quoteCurrencyAmount
            } else {
              queryObj.baseCurrencyAmount = moonpayQuote.totalAmount
            }

            url.set('query', queryObj)

            console.log('Approving moonpay quote url=' + url.href)
            await showUi.openExternalWebView({ url: url.href })
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

const addToAllowedCurrencies = (getTokenId: FiatProviderGetTokenId, pluginId: string, currency: MoonpayCurrency, currencyCode: string) => {
  if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = []
  const tokenId = getTokenId(pluginId, currencyCode.toUpperCase())
  if (tokenId === undefined) return
  addTokenToArray({ tokenId, otherInfo: currency }, allowedCurrencyCodes.crypto[pluginId])
}
