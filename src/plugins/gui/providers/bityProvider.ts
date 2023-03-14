import { lt } from 'biggystring'
import { asArray, asNumber, asObject, asString, asValue } from 'cleaners'

import { StringMap } from '../../../types/types'
import { FiatPaymentType } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMaps,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderQuote
} from '../fiatProviderTypes'

const pluginId = 'bity'
const storeId = 'com.bity'
const partnerIcon = 'logoBity.png'
const pluginDisplayName = 'Bity'

const allowedCurrencyCodes: FiatProviderAssetMaps = { crypto: {}, fiat: {} }
const allowedCountryCodes: { readonly [code: string]: boolean } = {
  AT: true,
  BE: true,
  BG: true,
  CH: true,
  CZ: true,
  DK: true,
  EE: true,
  FI: true,
  FR: true,
  DE: true,
  GR: true,
  HU: true,
  IT: true,
  LV: true,
  LT: true,
  LU: true,
  NL: true,
  PL: true,
  PT: true,
  RO: true,
  SK: true,
  SI: true,
  ES: true,
  SE: true,
  HR: true,
  LI: true,
  NO: true,
  SM: true,
  GB: true
}
const allowedPaymentTypes: { readonly [Payment in FiatPaymentType]?: boolean } = { sepa: true }

const CURRENCY_PLUGINID_MAP: StringMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin'
}

const asBityCurrencyTag = asValue('crypto', 'erc20', 'ethereum', 'fiat')
const asBityCurrency = asObject({
  tags: asArray(asBityCurrencyTag),
  code: asString,
  max_digits_in_decimal_part: asNumber
})
const asBityCurrencyResponse = asObject({ currencies: asArray(asBityCurrency) })

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

const getBityQuote = async (bodyData: BityQuoteRequest) => {
  const request = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  }
  try {
    const result = await fetch('https://exchange.api.bity.com/v2/orders/estimate', request)
    if (result.status === 200) {
      const newData = result.json()
      return newData
    } else {
      throw new Error('Unable to process request: ' + JSON.stringify(result, null, 2))
    }
  } catch (error: any) {
    throw new Error('Unable to process request: ' + JSON.stringify(error, null, 2))
  }
}

export const bityProvider: FiatProviderFactory = {
  pluginId,
  storeId,
  isNoApiKey: true,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const out = {
      pluginId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async (): Promise<FiatProviderAssetMaps> => {
        console.debug('makeProvider ' + pluginId)
        const response = await fetch(`https://exchange.api.bity.com/v2/currencies`).catch(e => undefined)
        if (response == null || !response.ok) return allowedCurrencyCodes

        const result = await response.json()
        let bityCurrencies: BityCurrency[] = []
        try {
          bityCurrencies = asBityCurrencyResponse(result).currencies
        } catch (error: any) {
          console.error(error)
          return allowedCurrencyCodes
        }
        for (const currency of bityCurrencies) {
          let isAddCurrencySuccess = true
          if (currency.tags.length === 1 && currency.tags[0] === 'fiat') {
            allowedCurrencyCodes.fiat['iso:' + currency.code.toUpperCase()] = currency
          } else if (currency.tags.includes('crypto')) {
            // Bity reports cryptos with a set of multiple tags such that there is
            // overlap, such as USDC being 'crypto', 'ethereum', 'erc20'.
            if (currency.tags.includes('erc20') && currency.tags.includes('ethereum')) {
              addToAllowedCurrencies('ethereum', currency, currency.code)
            } else if (currency.tags.length === 1 && Object.keys(CURRENCY_PLUGINID_MAP).includes(currency.code)) {
              addToAllowedCurrencies(CURRENCY_PLUGINID_MAP[currency.code], currency, currency.code)
            } else {
              isAddCurrencySuccess = false
            }
          } else {
            isAddCurrencySuccess = false
          }

          // Unhandled combination not caught by cleaner. Skip to be safe.
          if (!isAddCurrencySuccess) console.warn('Unhandled Bity supported currency: ', currency)
        }

        return allowedCurrencyCodes
      },
      getQuote: async (params: FiatProviderGetQuoteParams): Promise<FiatProviderQuote> => {
        const {
          // TODO: amountType, // input amount type - fiat | crypto
          direction,
          exchangeAmount,
          fiatCurrencyCode,
          // TODO: paymentTypes?,
          regionCode,
          tokenId,
          sepaInfo
        } = params
        const isBuy = direction === 'buy'
        if (!isBuy && sepaInfo == null) throw new Error('No SEPA info given')
        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ errorType: 'regionRestricted' })

        // TODO?
        // let foundPaymentType = false
        // for (const type of paymentTypes) {
        //   console.debug('checking type ' + type)
        //   const t = asFiatPaymentType(type)

        //   console.debug('checking asFiatPaymentType ' + t)
        //   if (allowedPaymentTypes[t]) {
        //     foundPaymentType = true
        //   }
        // }
        // if (!foundPaymentType) {
        //   console.debug(JSON.stringify(allowedPaymentTypes, null, 2))
        //   throw new FiatProviderError({ errorType: 'paymentUnsupported' })
        // }

        const cryptoCurrencyObj = asBityCurrency(allowedCurrencyCodes.crypto[tokenId.pluginId][tokenId?.tokenId ?? ''])
        const fiatCurrencyObj = asBityCurrency(allowedCurrencyCodes.fiat[fiatCurrencyCode])

        if (cryptoCurrencyObj == null || fiatCurrencyObj == null) throw new Error('Bity: Could not query supported currencies')

        const inputCurrencyCode = fiatCurrencyObj.code
        const outputCurrencyCode = isBuy ? cryptoCurrencyObj.code : fiatCurrencyObj.code
        const quoteRequest: BityQuoteRequest = {
          input: {
            amount: exchangeAmount,
            currency: inputCurrencyCode
          },
          output: {
            currency: outputCurrencyCode
          }
        }
        const bityQuote = await getBityQuote(quoteRequest)

        if (lt(exchangeAmount, bityQuote.input.minimum_amount)) {
          throw new FiatProviderError({ errorType: 'underLimit', errorAmount: parseFloat(bityQuote.input.minimum_amount) })
        }

        const paymentQuote: FiatProviderQuote = {
          pluginId,
          partnerIcon,
          regionCode,
          paymentTypes: [], // TODO: ?
          pluginDisplayName,
          tokenId: params.tokenId,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: isBuy ? bityQuote.input.amount : bityQuote.output.amount,
          cryptoAmount: isBuy ? bityQuote.output.amount : bityQuote.input.amount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            // TODO
          },
          closeQuote: async (): Promise<void> => {}
        }
        return paymentQuote
      }
    }
    return out
  }
}

const addToAllowedCurrencies = (pluginId: string, currency: BityCurrency, currencyCode: string) => {
  if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = {}
  allowedCurrencyCodes.crypto[pluginId][currencyCode] = currency
}
