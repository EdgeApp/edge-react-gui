import { lt } from 'biggystring'
import { asArray, asNumber, asObject, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'

import { StringMap } from '../../../types/types'
import { asFiatPaymentType, FiatPaymentType } from '../fiatPluginTypes'
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

const pluginId = 'bity'
const storeId = 'com.bity'
const partnerIcon = 'logoBity.png'
const pluginDisplayName = 'Bity'

const allowedCurrencyCodes: FiatProviderAssetMap = { crypto: {}, fiat: {} }
const allowedCountryCodes: { [code: string]: boolean } = {
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
const allowedPaymentTypes: { [Payment in FiatPaymentType]?: boolean } = { sepa: true }

const asBityCurrencyTag = asValue('crypto', 'erc20', 'ethereum', 'fiat')
const asBityCurrency = asObject({
  tags: asArray(asBityCurrencyTag),
  code: asString,
  max_digits_in_decimal_part: asNumber
})
const asBityCurrencyResponse = asObject({ currencies: asArray(asBityCurrency) })

export type BityCurrency = ReturnType<typeof asBityCurrency>
export type BityCurrencyTag = ReturnType<typeof asBityCurrencyTag>

const asBityQuote = asObject({
  input: asObject({
    amount: asString,
    currency: asString,
    minimum_amount: asString
  }),
  output: asObject({
    amount: asString,
    currency: asString
  })
})

export interface BityQuoteRequest {
  input: {
    amount?: string
    currency: string
  }
  output: {
    amount?: string
    currency: string
  }
}

export type BityQuote = ReturnType<typeof asBityQuote>

export interface BityBankInfo {
  iban: string
  bic_swift: string
  owner: {
    name: string
    address?: string
    address_complement?: string
    city?: string
    country?: string
    state?: string
    zip?: string
  }
}

export interface BityBuyOrderRequest {
  client_value: number
  input: {
    amount: string
    currency: string
    type: string
    iban: string
    bic_swift: string
    owner: {
      name: string
      address: string
      address_complement: string
      city: string
      country: string
      state: string
      zip: string
    }
  }
  output: {
    currency: string
    type: string
    crypto_address: string
  }
}

export interface BitySellOrderRequest {
  client_value: number
  input: {
    amount: string
    currency: string
    type: string
  }
  output: {
    currency: string
    type: string
    iban: string
    bic_swift: string
    owner: {
      name: string
      address: string
      address_complement: string
      city: string
      country: string
      state: string
      zip: string
    }
  }
}

const CURRENCY_PLUGINID_MAP: StringMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin'
}

export async function apiEstimate(data: BityQuoteRequest) {
  const request = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }
  const url = 'https://exchange.api.bity.com/v2/orders/estimate'
  const result = await fetch(url, request)
  if (result.status === 200) {
    const newData = result.json()
    return newData
  }
  throw new Error('Unable to process request at this time: ' + JSON.stringify(result, null, 2))
}

const signMessage = async (wallet: EdgeCurrencyWallet, message: string) => {
  console.log(`signMessage message:***${message}***`)

  const { publicAddress } = await wallet.getReceiveAddress()
  const signedMessage = await wallet.otherMethods.signMessageBase64(message, publicAddress)
  console.log(`signMessage public address:***${publicAddress}***`)
  console.log(`signMessage signedMessage:***${signedMessage}***`)
  return signedMessage
}

const deprecatedAndNotSupportedDouble = async (wallet: EdgeCurrencyWallet, request: any, firstURL: string, url2: string): Promise<any> => {
  console.debug('deprecatedAndNotSupportedDouble req: ' + JSON.stringify(request, null, 2))
  console.log('Bity firstURL: ' + firstURL)
  const response = await fetch(firstURL, request).catch(e => {
    console.log(`throw from fetch firstURL: ${firstURL}`, e)
    throw e
  })
  console.log('Bity response1: ', response)
  if (response.status !== 201) {
    const errorData = await response.json()
    throw new Error(errorData.errors[0].code + ' ' + errorData.errors[0].message)
  }
  const secondURL = url2 + response.headers.get('Location')
  console.log('Bity secondURL: ', secondURL)
  const request2 = {
    method: 'GET',
    credentials: 'include'
  }
  // @ts-expect-error
  const response2 = await fetch(secondURL, request2).catch(e => {
    console.log(`throw from fetch secondURL: ${secondURL}`, e)
    throw e
  })
  console.log('Bity response2: ', response2)
  if (response2.status !== 200) {
    throw new Error('Problem confirming order: Code n200')
  }
  const orderData = await response2.json()
  console.log('Bity orderData: ', orderData)
  if (orderData.message_to_sign) {
    const { body } = orderData.message_to_sign
    const signedTransaction = await signMessage(wallet, body)
    const thirdURL = url2 + orderData.message_to_sign.signature_submission_url
    const request = {
      method: 'POST',
      headers: {
        Host: 'exchange.api.bity.com',
        'Content-Type': '*/*'
      },
      body: signedTransaction
    }
    console.log('Bity thirdURL: ' + thirdURL)
    const signedTransactionResponse = await fetch(thirdURL, request).catch(e => {
      console.log(`throw from fetch thirdURL: ${thirdURL}`, e)
      throw e
    })
    console.log('Bity signedTransactionResponse: ', signedTransactionResponse)
    if (signedTransactionResponse.status === 400) {
      throw new Error('Could not complete transaction. Code: 470')
    }
    if (signedTransactionResponse.status === 204) {
      const bankDetailsRequest = {
        method: 'GET',
        credentials: 'include'
      }
      const detailUrl = firstURL + '/' + orderData.id
      console.log('detailURL: ' + detailUrl)
      // @ts-expect-error
      const bankDetailResponse = await fetch(detailUrl, bankDetailsRequest).catch(e => {
        console.log(`throw from fetch detailUrl: ${detailUrl}`, e)
        throw e
      })
      if (bankDetailResponse.status === 200) {
        const parsedResponse = await bankDetailResponse.json()
        console.log('Bity parsedResponse: ', parsedResponse)
        return parsedResponse
      }
    }
  }
  return orderData
}

async function apiOrder(wallet: EdgeCurrencyWallet, data: BityBuyOrderRequest | BitySellOrderRequest) {
  const request = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-Id': '4949bf59-c23c-4d71-949e-f5fd56ff815b'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }
  const url = 'https://exchange.api.bity.com/v2/orders'
  const url2 = 'https://exchange.api.bity.com'

  try {
    const response = await deprecatedAndNotSupportedDouble(wallet, request, url, url2)

    console.debug('apiOrder response: ', JSON.stringify(response, null, 2))
    return response
  } catch (e) {
    console.debug('We are in an error here handle it')
    console.debug(e)
    throw e
  }
}

export const bityProvider: FiatProviderFactory = {
  pluginId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const out = {
      pluginId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async (): Promise<FiatProviderAssetMap> => {
        const response = await fetch(`https://exchange.api.bity.com/v2/currencies`).catch(e => undefined)
        if (response == null || !response.ok) return allowedCurrencyCodes

        const result = await response.json()
        let bityCurrencies: BityCurrency[] = []
        try {
          bityCurrencies = asBityCurrencyResponse(result).currencies
        } catch (error: any) {
          console.log(error.message)
          console.log(JSON.stringify(error, null, 2))
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
          amountType, // input amount type - fiat | crypto
          direction,
          exchangeAmount,
          fiatCurrencyCode,
          paymentTypes,
          regionCode,
          tokenId,
          sepaInfo
        } = params
        const isBuy = direction === 'buy'
        if (isBuy && amountType === 'crypto') throw new Error('Bity only supports fiat buy quotes')
        if (!isBuy && amountType === 'fiat') throw new Error('Bity only supports crypto sell quotes')
        if (sepaInfo == null) throw new Error('No SEPA info given')
        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ errorType: 'regionRestricted' })

        let foundPaymentType = false
        for (const type of paymentTypes) {
          const t = asFiatPaymentType(type)
          if (allowedPaymentTypes[t]) {
            foundPaymentType = true
          }
        }
        if (!foundPaymentType) throw new FiatProviderError({ errorType: 'paymentUnsupported' })

        const cryptoCurrencyObj = asBityCurrency(allowedCurrencyCodes.crypto[tokenId.pluginId][tokenId?.tokenId ?? ''])
        const fiatCurrencyObj = asBityCurrency(allowedCurrencyCodes.fiat[fiatCurrencyCode])

        if (cryptoCurrencyObj == null || fiatCurrencyObj == null) throw new Error('Bity could not query supported currencies')

        const inputCurrencyCode = isBuy ? fiatCurrencyObj.code : cryptoCurrencyObj.code
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

        console.debug('apiQuote req: ' + JSON.stringify(quoteRequest, null, 2))
        const result = await apiEstimate(quoteRequest)
        console.debug('apiQuote res: ' + JSON.stringify(result, null, 2))
        const bityQuote = asBityQuote(result)

        console.debug('Got Bity quote')
        console.debug(JSON.stringify(bityQuote, null, 2))

        if (lt(exchangeAmount, bityQuote.input.minimum_amount)) {
          throw new FiatProviderError({ errorType: 'underLimit', errorAmount: parseFloat(bityQuote.input.minimum_amount) })
        }

        const paymentQuote: FiatProviderQuote = {
          pluginId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          tokenId: params.tokenId,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: isBuy ? bityQuote.input.amount : bityQuote.output.amount,
          cryptoAmount: isBuy ? bityQuote.output.amount : bityQuote.input.amount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 8000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            console.debug('approveQuote')
            const { coreWallet, showUi } = approveParams
            const { iban, swift, ownerAddress } = sepaInfo
            const { name, address, address2, city, country, state, postalCode } = ownerAddress
            const owner = {
              name,
              address,
              address_complement: address2 ?? '',
              city,
              country,
              state,
              zip: postalCode
            }
            const cryptoAddress = (await coreWallet.getReceiveAddress()).publicAddress
            const orderRes = isBuy
              ? // Buy Order Request
                await apiOrder(coreWallet, {
                  client_value: 0,
                  input: {
                    amount: exchangeAmount,
                    currency: inputCurrencyCode,
                    type: 'bank_account',
                    iban,
                    bic_swift: swift,
                    owner
                  },
                  output: {
                    currency: outputCurrencyCode,
                    type: 'crypto_address',
                    crypto_address: cryptoAddress
                  }
                })
              : // Sell Order Request
                await apiOrder(coreWallet, {
                  client_value: 0,
                  input: {
                    amount: exchangeAmount,
                    currency: inputCurrencyCode,
                    type: 'crypto_address'
                  },
                  output: {
                    currency: outputCurrencyCode,
                    type: 'bank_account',
                    iban,
                    bic_swift: swift,
                    owner
                  }
                })

            console.debug('approveQuote Res: ', JSON.stringify(orderRes, null, 2))
            // TODO:
            await showUi.transferInfo({ fieldMap: {} })
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
