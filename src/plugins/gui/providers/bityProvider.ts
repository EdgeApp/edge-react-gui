import { asMaybe, asObject, asString } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'

const asBityApproveQuoteResponse = asObject({
  id: asString,
  input: asObject({
    amount: asString,
    currency: asString,
    crypto_address: asMaybe(asString)
  }),
  output: asObject({
    amount: asMaybe(asString),
    currency: asMaybe(asString),
    crypto_address: asMaybe(asString)
  }),
  payment_details: asObject({
    iban: asString,
    swift_bic: asString,
    reference: asString,
    recipient_name: asString,
    recipient: asString
  })
})

type BityApproveQuoteResponse = ReturnType<typeof asBityApproveQuoteResponse>

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

interface BitySellOrderRequest {
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

const signMessage = async (wallet: EdgeCurrencyWallet, message: string) => {
  console.debug(`signMessage message:***${message}***`)

  const { publicAddress } = await wallet.getReceiveAddress()
  const signedMessage = await wallet.otherMethods.signMessageBase64(message, publicAddress)
  console.debug(`signMessage public address:***${publicAddress}***`)
  console.debug(`signMessage signedMessage:***${signedMessage}***`)
  return signedMessage
}

const deprecatedAndNotSupportedDouble = async (wallet: EdgeCurrencyWallet, request: any, firstURL: string, url2: string): Promise<BityApproveQuoteResponse> => {
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

const apiEstimate = async (data: BityQuoteRequest) => {
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

const apiOrder = async (wallet: EdgeCurrencyWallet, data: BityBuyOrderRequest | BitySellOrderRequest) => {
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
    return response
  } catch (e) {
    console.log('We are in an error here handle it')
    console.log(e)
    throw e
  }
}
