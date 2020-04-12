// @flow

import { primitives } from 'bcoin'
import { type EdgePaymentProtocolInfo } from 'edge-core-js/types'
import parse from 'url-parse'

import {
  toLegacyFormat,
  toNewFormat
} from '../utils/addressFormat/addressFormatIndex.js'
import { logger } from '../utils/logger.js'

const getSpendTargets = (
  outputs: Array<any>,
  network: string,
  currencyCode: string
) => {
  let nativeAmount = 0
  const spendTargets = []
  for (const output of outputs) {
    const jsonObj = output.getJSON(network)
    nativeAmount += jsonObj.value
    spendTargets.push({
      currencyCode: currencyCode,
      publicAddress: toNewFormat(jsonObj.address, network),
      nativeAmount: `${jsonObj.value}`
    })
  }
  return { nativeAmount, spendTargets }
}

const getBitPayPayment = async (
  paymentProtocolURL: string,
  network: string,
  fetch: any
): Promise<EdgePaymentProtocolInfo> => {
  const headers = { Accept: 'application/payment-request' }
  const result = await fetch(paymentProtocolURL, { headers })
  if (parseInt(result.status) !== 200) {
    const error = await result.text()
    throw new Error(error)
  }
  const paymentRequest = await result.json()
  const {
    outputs,
    memo,
    paymentUrl,
    paymentId,
    requiredFeeRate,
    currency
  } = paymentRequest
  const parsedOutputs = outputs.map(({ amount, address }) => {
    const legacyAddress = toLegacyFormat(address, network)
    return primitives.Output.fromOptions({
      value: amount,
      address: legacyAddress
    })
  })
  const { nativeAmount, spendTargets } = getSpendTargets(
    parsedOutputs,
    network,
    currency
  )
  const domain = parse(paymentUrl, {}).hostname
  // $FlowFixMe
  const edgePaymentProtocolInfo: EdgePaymentProtocolInfo = {
    nativeAmount: `${nativeAmount}`,
    merchant: { paymentId, requiredFeeRate },
    memo,
    domain,
    spendTargets,
    paymentUrl
  }

  return edgePaymentProtocolInfo
}

export async function getPaymentDetails (
  paymentProtocolURL: string,
  network: string,
  currencyCode: string,
  fetch: any
): Promise<EdgePaymentProtocolInfo> {
  return getBitPayPayment(paymentProtocolURL, network, fetch)
}

export function createPayment (
  paymentDetails: EdgePaymentProtocolInfo,
  refundAddress: string,
  tx: string,
  currencyCode: string
): any {
  return { currency: currencyCode, transactions: [tx] }
}

export async function sendPayment (
  fetch: any,
  network: string,
  paymentUrl: string,
  payment: any
): Promise<any> {
  const headers = { 'Content-Type': 'application/payment' }
  if (global.androidFetch) {
    try {
      const result = await global.androidFetch(paymentUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payment)
      })
      const paymentACK = JSON.parse(result)
      return paymentACK
    } catch (e) {
      logger.error(e)
      throw e
    }
  }
  const result = await fetch(paymentUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payment)
  })
  if (parseInt(result.status) !== 200) {
    const error = await result.text()
    throw new Error(error)
  }
  const paymentACK = await result.json()
  return paymentACK
}
