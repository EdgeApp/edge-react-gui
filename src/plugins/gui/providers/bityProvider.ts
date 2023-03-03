import { lt } from 'biggystring'
import { asArray, asMaybe, asNumber, asObject, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
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
import { SepaDisplayGroup } from '../scenes/SepaTransferScene'

const pluginId = 'bity'
const storeId = 'com.bity'
const partnerIcon = 'logoBity.png'
const pluginDisplayName = 'Bity'

const allowedCurrencyCodes: FiatProviderAssetMap = { crypto: {}, fiat: {} }
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

const DATA_DISPLAY_MAP: { readonly [bityDataKey: string]: string } = {
  id: s.strings.transaction_details_exchange_order_id,
  input: s.strings.input_title,
  input_amount: s.strings.input_output_amount,
  input_currency: s.strings.input_output_currency,
  output: s.strings.output_title,
  output_amount: s.strings.input_output_amount,
  output_currency: s.strings.input_output_currency,
  paymentdetails: s.strings.payment_details_title,
  paymentdetails_iban: s.strings.iban,
  paymentdetails_recipient: s.strings.recipient,
  paymentdetails_reference: s.strings.reference,
  paymentdetails_swiftbic: s.strings.swift_bic
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

// Full response:
// export const asBityApproveQuoteResponse = asObject({
//   input: asObject({
//     amount: asString,
//     currency: asString,
//     type: asMaybe(asString),
//     iban: asMaybe(asString)
//   }),
//   output: asObject({
//     amount: asMaybe(asString),
//     currency: asMaybe(asString),
//     type: asMaybe(asString),
//     crypto_address: asMaybe(asString)
//   }),
//   id: asString,
//   timestamp_created: asMaybe(asString),
//   timestamp_awaiting_payment_since: asMaybe(asString),
//   payment_details: asObject({
//     iban: asString,
//     recipient: asString,
//     recipient_name: asString,
//     recipient_postal_address: asArray(asString),
//     reference: asString,
//     swift_bic: asString,
//     type: asMaybe(asString)
//   }),
//   price_breakdown: asObject({
//     customer_trading_fee: asObject({
//       amount: asMaybe(asString),
//       currency: asMaybe(asString)
//     }),
//     non_verified_fee: asObject({
//       amount: asMaybe(asString),
//       currency: asMaybe(asString)
//     }),
//     output_transaction_cost: asObject({
//       amount: asMaybe(asString),
//       currency: asMaybe(asString)
//     })
//   }),
//   client_value: asMaybe(asNumber)
// })

export const asBityApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString
  }),
  output: asObject({
    amount: asMaybe(asString),
    currency: asMaybe(asString)
  }),
  payment_details: asObject({
    iban: asString,
    swift_bic: asString,
    reference: asString,
    recipient_name: asString,
    recipient: asString,
    recipient_postal_address: asArray(asString)
  })
})

export type BityApproveQuoteResponse = ReturnType<typeof asBityApproveQuoteResponse>

const CURRENCY_PLUGINID_MAP: StringMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin'
}

export const apiEstimate = async (data: BityQuoteRequest) => {
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
  console.debug(JSON.stringify(result, null, 2))
  if (result.status === 200) {
    const newData = result.json()
    return newData
  }
  throw new Error('Unable to process request at this time: ' + JSON.stringify(result, null, 2))
}

const signMessage = async (wallet: EdgeCurrencyWallet, message: string) => {
  console.debug(`signMessage message:***${message}***`)

  const { publicAddress } = await wallet.getReceiveAddress()
  const signedMessage = await wallet.otherMethods.signMessageBase64(message, publicAddress)
  console.debug(`signMessage public address:***${publicAddress}***`)
  console.debug(`signMessage signedMessage:***${signedMessage}***`)
  return signedMessage
}

const deprecatedAndNotSupportedDouble = async (
  wallet: EdgeCurrencyWallet,
  request: any,
  orderUrl: string,
  baseUrl: string
): Promise<BityApproveQuoteResponse> => {
  console.debug('deprecatedAndNotSupportedDouble req: ' + JSON.stringify(request, null, 2))
  console.debug('Bity firstURL: ' + orderUrl)
  const response = await fetch(orderUrl, request).catch(e => {
    console.debug(`throw from fetch firstURL: ${orderUrl}`, e)
    throw e
  })
  console.debug('Bity response1: ', response)
  if (response.status !== 201) {
    const errorData = await response.json()
    throw new Error(errorData.errors[0].code + ' ' + errorData.errors[0].message)
  }
  const secondURL = baseUrl + response.headers.get('Location')
  console.debug('Bity secondURL: ', secondURL)
  const request2 = {
    method: 'GET',
    credentials: 'include'
  }
  // @ts-expect-error
  const response2 = await fetch(secondURL, request2).catch(e => {
    console.debug(`throw from fetch secondURL: ${secondURL}`, e)
    throw e
  })
  console.debug('Bity response2: ', response2)
  if (response2.status !== 200) {
    throw new Error('Problem confirming order: Code n200')
  }
  const orderData = await response2.json()
  console.debug('Bity orderData: ', JSON.stringify(orderData, null, 2))
  if (orderData.message_to_sign) {
    console.debug('orderData.message_to_sign')
    const { body } = orderData.message_to_sign
    const signedTransaction = await signMessage(wallet, body)
    const thirdURL = baseUrl + orderData.message_to_sign.signature_submission_url
    const request = {
      method: 'POST',
      headers: {
        Host: 'exchange.api.bity.com',
        'Content-Type': '*/*'
      },
      body: signedTransaction
    }
    console.debug('Bity thirdURL: ' + thirdURL)
    const signedTransactionResponse = await fetch(thirdURL, request).catch(e => {
      console.debug(`throw from fetch thirdURL: ${thirdURL}`, e)
      throw e
    })
    console.debug('Bity signedTransactionResponse: ', signedTransactionResponse)
    if (signedTransactionResponse.status === 400) {
      throw new Error('Could not complete transaction. Code: 470')
    }
    if (signedTransactionResponse.status === 204) {
      const bankDetailsRequest = {
        method: 'GET',
        credentials: 'include'
      }
      const detailUrl = orderUrl + '/' + orderData.id
      console.debug('detailURL: ' + detailUrl)
      // @ts-expect-error
      const bankDetailResponse = await fetch(detailUrl, bankDetailsRequest).catch(e => {
        console.debug(`throw from fetch detailUrl: ${detailUrl}`, e)
        throw e
      })
      if (bankDetailResponse.status === 200) {
        // HACK: can't clean an object with a '-' in its key. Manually pre-clean
        const preCleanedResponse = (await bankDetailResponse.text()).replace('non-verified_fee', 'non_verified_fee')

        return asBityApproveQuoteResponse(JSON.parse(preCleanedResponse))
      }
    }
  }

  // Unknown how to get here - hopefully the data is in the same shape as the
  // known path.
  console.warn('Bity quote approval response - unhandled path...')
  return asBityApproveQuoteResponse(orderData)
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
        if (amountType === 'crypto') throw new Error('Bity only supports fiat buy quotes')
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
        const bityQuote = await apiEstimate(quoteRequest)

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
            // const approveQuoteRes = isBuy
            //   ? // Buy Order Request
            //     await apiOrder(coreWallet, {
            //       client_value: 0,
            //       input: {
            //         amount: exchangeAmount,
            //         currency: inputCurrencyCode,
            //         type: 'bank_account',
            //         iban,
            //         bic_swift: swift,
            //         owner
            //       },
            //       output: {
            //         currency: outputCurrencyCode,
            //         type: 'crypto_address',
            //         crypto_address: cryptoAddress
            //       }
            //     })
            //   : // Sell Order Request
            //     await apiOrder(coreWallet, {
            //       client_value: 0,
            //       input: {
            //         amount: exchangeAmount,
            //         currency: inputCurrencyCode,
            //         type: 'crypto_address'
            //       },
            //       output: {
            //         currency: outputCurrencyCode,
            //         type: 'bank_account',
            //         iban,
            //         bic_swift: swift,
            //         owner
            //       }
            //     })

            const approveQuoteRes = {
              input: {
                amount: '11.00',
                currency: 'EUR',
                type: 'bank_account',
                iban: 'IT21G0300203280333113817227'
              },
              output: {
                amount: '0.00046694',
                currency: 'BTC',
                type: 'crypto_address',
                crypto_address: '3MgF24SdB8XhmRpAdxj7i45YEpd9TCK5eD'
              },
              id: '8bd6b40b-bd7c-40c9-9439-dc759d30bba1',
              timestamp_created: '2023-03-02T23:19:06Z',
              timestamp_awaiting_payment_since: '2023-03-02T23:19:16Z',
              payment_details: {
                iban: 'CH3400766000102941689',
                recipient: 'Bity SA, Rue des Usines 44, 2000 Neuchâtel, Switzerland',
                recipient_name: 'Bity SA',
                recipient_postal_address: ['Rue des Usines 44', '2000 Neuchâtel', 'Switzerland'],
                reference: 'bity.com 966D-NXG8',
                swift_bic: 'BCNNCH22XXX',
                type: 'bank_account'
              },
              price_breakdown: {
                customer_trading_fee: {
                  amount: '0.09',
                  currency: 'EUR'
                },
                non_verified_fee: {
                  amount: '0.04',
                  currency: 'EUR'
                },
                output_transaction_cost: {
                  amount: '0.00002345',
                  currency: 'BTC'
                }
              },
              client_value: 0
            }

            // Generic parsing implementation is too complicated. Hard-code.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { input, output, id, payment_details } = approveQuoteRes
            const groupedDisplayData: SepaDisplayGroup[] = [
              {
                groupTitle: DATA_DISPLAY_MAP.input,
                items: [
                  {
                    label: DATA_DISPLAY_MAP.input_amount,
                    value: input.amount
                  },
                  {
                    label: DATA_DISPLAY_MAP.input_currency,
                    value: input.currency
                  }
                ]
              },
              {
                groupTitle: DATA_DISPLAY_MAP.output,
                items: [
                  {
                    label: DATA_DISPLAY_MAP.output_amount,
                    value: output.amount
                  },
                  {
                    label: DATA_DISPLAY_MAP.output_currency,
                    value: output.currency
                  }
                ]
              },
              {
                groupTitle: DATA_DISPLAY_MAP.paymentdetails,
                items: [
                  {
                    label: DATA_DISPLAY_MAP.id,
                    value: id
                  },
                  {
                    label: DATA_DISPLAY_MAP.paymentdetails_iban,
                    value: payment_details.iban
                  },
                  {
                    label: DATA_DISPLAY_MAP.paymentdetails_swiftbic,
                    value: payment_details.swift_bic
                  },
                  {
                    label: DATA_DISPLAY_MAP.paymentdetails_recipient,
                    value: payment_details.recipient
                  },
                  {
                    label: DATA_DISPLAY_MAP.paymentdetails_reference,
                    value: payment_details.reference
                  }
                ]
              }
            ]

            await showUi.transferInfo({
              headerTitle: s.strings.payment_details_title,
              groupedDisplayData,
              promptMessage: sprintf(s.strings.sepa_transfer_prompt_s, id)
            })
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
