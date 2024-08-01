import { gt, lt, toFixed } from 'biggystring'
import { asArray, asEither, asMaybe, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet, EdgeSpendInfo, EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../locales/strings'
import { HomeAddress, SepaInfo } from '../../../types/FormTypes'
import { StringMap } from '../../../types/types'
import { utf8 } from '../../../util/encoding'
import { removeIsoPrefix } from '../../../util/utils'
import { FiatPaymentType, FiatPluginUi } from '../fiatPluginTypes'
import {
  FiatProvider,
  FiatProviderApproveQuoteParams,
  FiatProviderAssetMap,
  FiatProviderError,
  FiatProviderFactory,
  FiatProviderFactoryParams,
  FiatProviderGetQuoteParams,
  FiatProviderGetTokenId,
  FiatProviderQuote
} from '../fiatProviderTypes'
import { addTokenToArray } from '../util/providerUtils'

const providerId = 'bity'
const storeId = 'com.bity'
const partnerIcon = 'logoBity.png'
const pluginDisplayName = 'Bity'
const providerDisplayName = pluginDisplayName
const supportEmail = 'support_edge@bity.com'
const supportedPaymentType: FiatPaymentType = 'sepa'
const partnerFee = 0.005

const allowedCurrencyCodes: FiatProviderAssetMap = { providerId, crypto: {}, fiat: {} }
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
  IE: true, // Ireland
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
  clientId: asMaybe(asString, EDGE_CLIENT_ID)
})

const asBityCurrencyTag = asValue('crypto', 'erc20', 'ethereum', 'fiat')
const asBityCurrency = asObject({
  tags: asArray(asBityCurrencyTag),
  code: asString,
  max_digits_in_decimal_part: asNumber
})
const asBityCurrencyResponse = asObject({ currencies: asArray(asBityCurrency) })

const asBityErrorResponse = asObject({ errors: asArray(asObject({ code: asString, message: asString })) })

// const asCurrencyAmount = asObject({
//   amount: asString,
//   currency: asString
// })

// const asPriceBreakdown = asObject({
//   customer_trading_fee: asCurrencyAmount,
//   output_transaction_cost: asCurrencyAmount,
//   'non-verified_fee': asCurrencyAmount
// })

// Main cleaner for the input object
const asInputObject = asObject({
  // object_information_optional: asOptional(asBoolean), // optional field
  // type: asString,
  amount: asString,
  currency: asString,
  minimum_amount: asOptional(asString)
})

// Main cleaner for the output object
const asOutputObject = asObject({
  // type: asString,
  amount: asString,
  currency: asString,
  minimum_amount: asOptional(asString)
})

// Complete data cleaner
const asBityQuote = asObject({
  input: asInputObject,
  output: asOutputObject
  // price_breakdown: asPriceBreakdown
})

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
  partner_fee: { factor: number }
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
  partner_fee: { factor: number }
}

const asBitySellApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asString
  }),
  output: asObject({
    amount: asString,
    currency: asString
  }),
  payment_details: asObject({
    crypto_address: asString,
    type: asValue('crypto_address')
  })
})

const asBityBuyApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString
  }),
  output: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asString
  }),
  payment_details: asObject({
    iban: asString,
    swift_bic: asString,
    reference: asString,
    recipient_name: asString,
    recipient: asString
  })
})

const asBityApproveQuoteResponse = asEither(asBityBuyApproveQuoteResponse, asBitySellApproveQuoteResponse)

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
  if (result.ok) {
    const newData = await result.json()
    return newData
  } else {
    let bityErrorRes
    try {
      bityErrorRes = asBityErrorResponse(await result.json())
    } catch (e) {
      // TODO: Implement typed generic provider error handling now that providerId
      // is a required FiatProviderQuoteError param.
      throw new Error('Bity: Unable to fetch quote: ' + (await result.text()))
    }
    if (bityErrorRes.errors.some((bityError: { code: string; message: string }) => bityError.code === 'amount_too_large')) {
      throw new FiatProviderError({ providerId, errorType: 'overLimit' })
    }
  }
}

const approveBityQuote = async (
  wallet: EdgeCurrencyWallet,
  data: BityBuyOrderRequest | BitySellOrderRequest,
  clientId: string
): Promise<BityApproveQuoteResponse> => {
  const baseUrl = 'https://exchange.api.bity.com'
  const orderUrl = 'https://exchange.api.bity.com/v2/orders'
  const orderReq: RequestInit = {
    method: 'POST',
    headers: {
      Host: 'exchange.api.bity.com',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-Id': clientId
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
    const { publicAddress } = await wallet.getReceiveAddress({ tokenId: null })
    const signedMessage = await wallet.signBytes(utf8.parse(body), { otherParams: { publicAddress } })
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
  providerId,
  storeId,
  makeProvider: async (params: FiatProviderFactoryParams): Promise<FiatProvider> => {
    const { apiKeys, getTokenId } = params
    const clientId = asBityApiKeys(apiKeys).clientId

    const out: FiatProvider = {
      providerId,
      partnerIcon,
      pluginDisplayName,
      getSupportedAssets: async ({ paymentTypes }): Promise<FiatProviderAssetMap> => {
        // Return nothing if 'sepa' is not included in the props
        if (!paymentTypes.includes(supportedPaymentType)) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const response = await fetch(`https://exchange.api.bity.com/v2/currencies`).catch(e => undefined)
        if (response == null || !response.ok) {
          console.error(`Bity getSupportedAssets response error: ${await response?.text()}`)
          return allowedCurrencyCodes
        }

        const result = await response.json()
        let bityCurrencies: BityCurrency[] = []
        try {
          bityCurrencies = asBityCurrencyResponse(result).currencies
        } catch (error: any) {
          console.error(error)
          return allowedCurrencyCodes
        }
        for (const currency of bityCurrencies) {
          let isAddCurrencySuccess = false
          if (currency.tags.length === 1 && currency.tags[0] === 'fiat') {
            allowedCurrencyCodes.fiat['iso:' + currency.code.toUpperCase()] = currency
            isAddCurrencySuccess = true
          } else if (currency.tags.includes('crypto')) {
            // Bity reports cryptos with a set of multiple tags such that there is
            // overlap, such as USDC being 'crypto', 'ethereum', 'erc20'.
            if (currency.tags.includes('erc20') && currency.tags.includes('ethereum')) {
              // ETH tokens
              addToAllowedCurrencies(getTokenId, 'ethereum', currency, currency.code)
              isAddCurrencySuccess = true
            } else if (Object.keys(CURRENCY_PLUGINID_MAP).includes(currency.code)) {
              // Mainnet currencies
              addToAllowedCurrencies(getTokenId, CURRENCY_PLUGINID_MAP[currency.code], currency, currency.code)
              isAddCurrencySuccess = true
            }
          }

          // Unhandled combination not caught by cleaner. Skip to be safe.
          if (!isAddCurrencySuccess) console.log('Unhandled Bity supported currency: ', currency)
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
          pluginId,
          tokenId,
          displayCurrencyCode
        } = params
        const isBuy = direction === 'buy'
        if (!allowedCountryCodes[regionCode.countryCode]) throw new FiatProviderError({ providerId, errorType: 'regionRestricted', displayCurrencyCode })
        if (!paymentTypes.includes(supportedPaymentType)) throw new FiatProviderError({ providerId, errorType: 'paymentUnsupported' })

        const bityCurrency = allowedCurrencyCodes.crypto[pluginId].find(t => t.tokenId === tokenId)
        const cryptoCurrencyObj = asBityCurrency(bityCurrency?.otherInfo)
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
        const raw = await fetchBityQuote(quoteRequest)
        const bityQuote = asBityQuote(raw)
        console.log('Got Bity quote:\n', JSON.stringify(bityQuote, null, 2))

        const minimumAmount = isReverseQuote ? bityQuote.output.minimum_amount : bityQuote.input.minimum_amount
        if (minimumAmount != null && lt(amount, minimumAmount)) {
          throw new FiatProviderError({
            // TODO: direction,
            providerId,
            errorType: 'underLimit',
            errorAmount: parseFloat(minimumAmount)
          })
        }

        // Because Bity only supports <=1k transactions w/o KYC and we have no
        // way to KYC a user, add a 1k limit
        if (amountType === 'fiat') {
          if (gt(exchangeAmount, '1000')) {
            throw new FiatProviderError({
              providerId,
              errorType: 'overLimit',
              errorAmount: 1000,
              displayCurrencyCode: removeIsoPrefix(fiatCurrencyCode)
            })
          }
        } else {
          // User entered a crypto amount. Get the crypto amount for 1k fiat
          // so we can compare crypto amounts.
          const kRequest: BityQuoteRequest = {
            input: {
              amount: isBuy ? '1000' : undefined,
              currency: isBuy ? fiatCode : cryptoCode
            },
            output: {
              amount: isBuy ? undefined : '1000',
              currency: isBuy ? cryptoCode : fiatCode
            }
          }

          const kRaw = await fetchBityQuote(kRequest)
          const kBityQuote = asBityQuote(kRaw)
          if (isBuy) {
            if (lt(kBityQuote.output.amount, exchangeAmount)) {
              throw new FiatProviderError({
                providerId,
                errorType: 'overLimit',
                errorAmount: parseFloat(kBityQuote.output.amount),
                displayCurrencyCode: kBityQuote.output.currency
              })
            }
          } else {
            if (lt(kBityQuote.input.amount, exchangeAmount)) {
              throw new FiatProviderError({
                providerId,
                errorType: 'overLimit',
                errorAmount: parseFloat(kBityQuote.input.amount),
                displayCurrencyCode: kBityQuote.input.currency
              })
            }
          }
        }

        // Check for a max amount limit from the API. This is mostly useless due to the
        // 1k limit above but do it anyway in case the API somehow returns a lower limit.
        //
        // When a quote is requested that is larger than the maximum amount,
        // Bity returns a quote at the maximum value
        const quoteCurrencyCode = removeIsoPrefix(amountType === 'fiat' ? fiatCurrencyCode : cryptoCode)
        let quoteAmount
        if (isBuy) {
          quoteAmount = amountType === 'fiat' ? bityQuote.input.amount : bityQuote.output.amount
        } else {
          quoteAmount = amountType === 'fiat' ? bityQuote.output.amount : bityQuote.input.amount
        }
        if (lt(quoteAmount, amount)) {
          throw new FiatProviderError({
            providerId,
            errorType: 'overLimit',
            errorAmount: parseFloat(quoteAmount),
            displayCurrencyCode: quoteCurrencyCode
          })
        }

        const paymentQuote: FiatProviderQuote = {
          providerId,
          partnerIcon,
          regionCode,
          paymentTypes,
          pluginDisplayName,
          displayCurrencyCode: params.displayCurrencyCode,
          isEstimate: false,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount: isBuy ? bityQuote.input.amount : bityQuote.output.amount,
          cryptoAmount: isBuy ? bityQuote.output.amount : bityQuote.input.amount,
          direction: params.direction,
          expirationDate: new Date(Date.now() + 50000),
          approveQuote: async (approveParams: FiatProviderApproveQuoteParams): Promise<void> => {
            const { coreWallet, showUi } = approveParams
            // Either input or output always require SEPA info, depending on if
            // input or output are of type 'bank_account'.
            // Bity only checks SEPA info format validity.
            // Home address and KYC is only required for sell.

            const cryptoAddress = (await coreWallet.getReceiveAddress({ tokenId: null })).publicAddress

            await showUi.sepaForm({
              headerTitle: lstrings.sepa_form_title,
              onSubmit: async (sepaInfo: SepaInfo) => {
                let approveQuoteRes: BityApproveQuoteResponse | null = null
                try {
                  if (isBuy) {
                    approveQuoteRes = await executeBuyOrderFetch(coreWallet, bityQuote, fiatCode, sepaInfo, outputCurrencyCode, cryptoAddress, clientId)
                  } else {
                    // Sell approval - Needs extra address input step
                    await showUi.addressForm({
                      countryCode: regionCode.countryCode,
                      headerTitle: lstrings.home_address_title,
                      onSubmit: async (homeAddress: HomeAddress) => {
                        approveQuoteRes = await executeSellOrderFetch(
                          coreWallet,
                          bityQuote,
                          inputCurrencyCode,
                          cryptoAddress,
                          outputCurrencyCode,
                          sepaInfo,
                          homeAddress,
                          clientId
                        )
                      }
                    })
                  }
                } catch (e) {
                  // TODO: Post-fiat-plugin-router implementation:
                  // Route to the appropriate scene where the user needs to fix
                  // their personal info depending on what was wrong with the
                  // order, i.e. invalid bank or address info.
                  console.error('Bity order error: ', e)
                }

                if (approveQuoteRes == null) {
                  return
                }

                if (isBuy) {
                  await completeBuyOrder(approveQuoteRes, showUi)
                } else {
                  await completeSellOrder(approveQuoteRes, coreWallet, showUi, fiatCurrencyCode, tokenId)
                }

                showUi.exitScene()
              }
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

const addToAllowedCurrencies = (getTokenId: FiatProviderGetTokenId, pluginId: string, currency: BityCurrency, currencyCode: string) => {
  if (allowedCurrencyCodes.crypto[pluginId] == null) allowedCurrencyCodes.crypto[pluginId] = []
  const tokenId = getTokenId(pluginId, currencyCode)
  if (tokenId === undefined) return

  const tokens = allowedCurrencyCodes.crypto[pluginId]
  addTokenToArray({ tokenId, otherInfo: currency }, tokens)
}

/**
 * Transition to the send scene pre-populted with the payment address from the
 * previously opened/approved sell order
 */
const completeSellOrder = async (
  approveQuoteRes: BityApproveQuoteResponse,
  coreWallet: EdgeCurrencyWallet,
  showUi: FiatPluginUi,
  fiatCurrencyCode: string,
  tokenId: EdgeTokenId
) => {
  const { input, id, payment_details: paymentDetails, output } = asBitySellApproveQuoteResponse(approveQuoteRes)
  const { amount: inputAmount, currency: inputCurrencyCode } = input
  const { amount: fiatAmount } = output

  const nativeAmount = await coreWallet.denominationToNative(inputAmount, inputCurrencyCode)

  if (nativeAmount == null) {
    // Should not happen - input currencies should be valid before
    // getting here.
    throw new Error('Bity: Could not find input denomination: ' + inputCurrencyCode)
  }

  const spendInfo: EdgeSpendInfo = {
    tokenId,
    assetAction: {
      assetActionType: 'sell'
    },
    savedAction: {
      actionType: 'fiat',
      orderId: id,
      isEstimate: true,
      fiatPlugin: {
        providerId,
        providerDisplayName,
        supportEmail
      },
      payinAddress: paymentDetails.crypto_address,
      cryptoAsset: {
        pluginId: coreWallet.currencyInfo.pluginId,
        tokenId,
        nativeAmount
      },
      fiatAsset: {
        fiatCurrencyCode,
        fiatAmount
      }
    },
    spendTargets: [
      {
        nativeAmount,
        publicAddress: paymentDetails.crypto_address
      }
    ]
  }
  await showUi.send({ walletId: coreWallet.id, spendInfo, tokenId })
}

/**
 * Transition to the transfer scene to display the bank transfer information
 * from the previously opened/approved buy order
 */
const completeBuyOrder = async (approveQuoteRes: BityApproveQuoteResponse, showUi: FiatPluginUi) => {
  const { input, output, id, payment_details: paymentDetails } = asBityBuyApproveQuoteResponse(approveQuoteRes)

  const { iban, swift_bic: swiftBic, recipient, reference } = paymentDetails

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
        swiftBic: swiftBic,
        recipient: recipient,
        reference: reference
      }
    },
    onDone: async () => {
      showUi.exitScene()
    }
  })
}

/**
 * Physically opens the sell order, resulting in payment information detailing
 * where to send crypto (payment address) in order to complete the order.
 */
const executeSellOrderFetch = async (
  coreWallet: EdgeCurrencyWallet,
  bityQuote: any,
  inputCurrencyCode: string,
  cryptoAddress: string,
  outputCurrencyCode: string,
  sepaInfo: { name: string; iban: string; swift: string },
  homeAddress: { address: string; address2: string | undefined; city: string; country: string; state: string; postalCode: string },
  clientId: string
): Promise<BityApproveQuoteResponse | null> => {
  return await approveBityQuote(
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
      },
      partner_fee: { factor: partnerFee }
    },
    clientId
  )
}

/**
 * Physically opens the buy order, resulting in payment information detailing
 * where to send fiat (bank details) in order to complete the order.
 */
const executeBuyOrderFetch = async (
  coreWallet: EdgeCurrencyWallet,
  bityQuote: any,
  fiatCode: string,
  sepaInfo: { name: string; iban: string; swift: string },
  outputCurrencyCode: string,
  cryptoAddress: string,
  clientId: string
): Promise<BityApproveQuoteResponse | null> => {
  return await approveBityQuote(
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
      },
      partner_fee: { factor: partnerFee }
    },
    clientId
  )
}
