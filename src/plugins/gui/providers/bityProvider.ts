import { lt, toFixed } from 'biggystring'
import { asArray, asMaybe, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../locales/strings'
import { HomeAddress, SepaInfo } from '../../../types/FormTypes'
import { StringMap } from '../../../types/types'
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

const CURRENCY_PLUGINID_MAP: StringMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LTC: 'litecoin'
}

const EDGE_CLIENT_ID = '4949bf59-c23c-4d71-949e-f5fd56ff815b'

const asBityApiKeys = asObject({
  clientId: asMaybe(asString)
})

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
      address: string
      address_complement?: string
      city: string
      country: string
      state: string
      zip: string
    }
  }
}

const asBityApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asOptional(asString)
  }),
  output: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asOptional(asString)
  }),
  payment_details: asMaybe(
    asObject({
      iban: asString,
      swift_bic: asString,
      reference: asString,
      recipient_name: asString,
      recipient: asString
    })
  )
})

type BityApproveQuoteResponse = ReturnType<typeof asBityApproveQuoteResponse>

const fetchBityQuote = async (bodyData: BityQuoteRequest) => {
  const request = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  }
  const result = await fetch('https://exchange.api.bity.com/v2/orders/estimate', request)
  if (result.status === 200) {
    const newData = await result.json()
    return newData
  } else {
    throw new Error('Unable to process request: ' + JSON.stringify(result, null, 2))
  }
}

const approveBityQuote = async (
  wallet: EdgeCurrencyWallet,
  data: BityBuyOrderRequest | BitySellOrderRequest,
  clientId?: string
): Promise<BityApproveQuoteResponse> => {
  const baseUrl = 'https://exchange.api.bity.com'
  const orderUrl = 'https://exchange.api.bity.com/v2/orders'
  const orderReq: RequestInit = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-Id': clientId ?? EDGE_CLIENT_ID
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }

  const orderRes = await fetch(orderUrl, orderReq)

  if (orderRes.status !== 201) {
    const errorData = await orderRes.json()
    throw new Error(errorData.errors[0].code + ' ' + errorData.errors[0].message)
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
    const { publicAddress } = await wallet.getReceiveAddress()
    const signedMessage = await wallet.signMessage(body, { otherParams: { publicAddress } })
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
      // @ts-expect-error
      const bankDetailRes = await fetch(detailUrl, bankDetailsReq)
      if (bankDetailRes.status === 200) {
        const bankDetailResJson = await bankDetailRes.json()
        return asBityApproveQuoteResponse(bankDetailResJson)
      }
    }
  }
  return asBityApproveQuoteResponse(orderData)
}

export const bityProvider: FiatProviderFactory = {
  pluginId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys, showUi } = params
    const clientId = asBityApiKeys(apiKeys).clientId

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
              // ETH tokens
              addToAllowedCurrencies('ethereum', currency, currency.code)
            } else if (Object.keys(CURRENCY_PLUGINID_MAP).includes(currency.code)) {
              // Mainnet currencies
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
          tokenId
        } = params
        const isBuy = direction === 'buy'
        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ errorType: 'regionRestricted' })
        if (paymentTypes[0] !== 'sepa') throw new FiatProviderError({ errorType: 'paymentUnsupported' })

        const cryptoCurrencyObj = asBityCurrency(allowedCurrencyCodes.crypto[tokenId.pluginId][tokenId?.tokenId ?? ''])
        const fiatCurrencyObj = asBityCurrency(allowedCurrencyCodes.fiat[fiatCurrencyCode])

        if (cryptoCurrencyObj == null || fiatCurrencyObj == null) throw new Error('Bity: Could not query supported currencies')
        const cryptoCode = cryptoCurrencyObj.code
        const fiatCode = fiatCurrencyObj.code

        const inputCurrencyCode = isBuy ? fiatCode : cryptoCode
        const outputCurrencyCode = isBuy ? cryptoCode : fiatCode

        const amountPrecision = amountType === 'fiat' ? fiatCurrencyObj.max_digits_in_decimal_part : cryptoCurrencyObj.max_digits_in_decimal_part

        const amount = toFixed(exchangeAmount, amountPrecision)
        const isReverseQuote = (isBuy && amountType === 'crypto') || (!isBuy && amountType === 'fiat')
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
        const bityQuote = await fetchBityQuote(quoteRequest)
        console.debug('Got Bity quote:\n', JSON.stringify(bityQuote, null, 2))

        const minimumAmount = isReverseQuote ? bityQuote.output.minimum_amount : bityQuote.input.minimum_amount
        if (lt(amount, minimumAmount)) {
          throw new FiatProviderError({
            // TODO: direction,
            errorType: 'underLimit',
            errorAmount: parseFloat(minimumAmount)
          })
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
            const { coreWallet } = approveParams
            // Either input or output always require SEPA info, depending on if
            // input or output are of type 'bank_account'.
            // Bity only checks SEPA info format validity.
            // Home address and KYC is only required for sell.

            const sepaInfo = await showUi.sepaForm({
              headerTitle: lstrings.enter_bank_info_title,
              onSubmit: async (formSepaInfo: SepaInfo) => {
                // TODO: See fiatPluginTypes.ts
              }
            })
            showUi.popScene()

            if (sepaInfo == null) {
              return
            }

            const cryptoAddress = (await coreWallet.getReceiveAddress()).publicAddress
            let approveQuoteRes: BityApproveQuoteResponse | null = null

            try {
              if (isBuy) {
                approveQuoteRes = await approveBityQuote(
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
                    }
                  },
                  clientId
                )
              } else {
                // Sell approval
                const homeAddress = await showUi.addressForm({
                  countryCode: regionCode.countryCode,
                  headerTitle: lstrings.home_address_title,
                  onSubmit: async (formAddress: HomeAddress) => {
                    // TODO: See fiatPluginTypes.ts
                  }
                })
                showUi.popScene()

                if (homeAddress == null) {
                  return
                }

                approveQuoteRes = await approveBityQuote(
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
                        address: homeAddress.address,
                        address_complement: homeAddress.address2,
                        city: homeAddress.city,
                        state: homeAddress.state,
                        zip: homeAddress.postalCode,
                        country: homeAddress.country
                      }
                    }
                  },
                  clientId
                )
              }
            } catch (e) {
              // TODO: Post-routing implementation: Route to the appropriate
              // scene for the user to fix depending on what was wrong with the
              // order.
              console.error('Bity order error: ', e)
            }

            if (approveQuoteRes == null) {
              return
            }

            if (isBuy) {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              const { input, output, id, payment_details } = approveQuoteRes
              if (payment_details == null || output.crypto_address == null) return

              // eslint-disable-next-line @typescript-eslint/naming-convention
              const { iban, swift_bic, recipient, reference } = payment_details

              await showUi.sepaTransferInfo({
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
                    id: id,
                    iban: iban,
                    swiftBic: swift_bic,
                    recipient: recipient,
                    reference: reference
                  }
                },
                onDone: async () => {
                  // TODO: See fiatPluginTypes.ts
                }
              })
            } else {
              // TODO:
              console.debug('Sending crypto to approved sell quote address')
            }

            showUi.popScene()
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
