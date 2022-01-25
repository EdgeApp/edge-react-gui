// @flow

import { type Cleaner, asArray, asBoolean, asDate, asMaybe, asNumber, asObject, asOptional, asString } from 'cleaners'
import { type EdgeCurrencyWallet, type EdgeSpendInfo, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { WalletListModal } from '../components/modals/WalletListModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { BitPayError, BitPayErrorCode } from '../types/BitPayError.js'
import {
  type BpInstructionOutput,
  type BpInvoiceInstruction,
  type BpInvoiceResponse,
  type BpOption,
  type BpOptionsResponse,
  type BpTransaction,
  type BpVerificationPayment,
  type BpVerificationResponse
} from '../types/BitpayTypes.js'
import { type Dispatch } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
/**
 * Performs the fetch commands to BitPay.
 * Throws errors when response is not OK.
 */
async function fetchBitPayJsonResponse(uri: string, init: Object): Promise<Response> {
  const fetchResponse = await fetch(uri, init)
  if (!fetchResponse.ok || fetchResponse.status !== 200) {
    const text = await fetchResponse.text()
    const statusCode = fetchResponse.status.toString()
    const headers = (init.headers: any)
    const body = init.body ? JSON.stringify(init.body) : ''
    const method = init.method

    // Parse a useful header string
    let header = ''
    if (headers.Accept) header = headers.Accept
    else if (headers['Content-Type']) header = headers['Content-Type']
    const trimText = 'application/'
    if (header.includes(trimText)) header = header.split(trimText)[1]

    throw new BitPayError(BitPayErrorCode.FetchFailed, { header, statusCode, text, errorData: { uri, body, method } })
  }

  return await fetchResponse.json()
}

/**
 * Handles the BitPay scanned or deeplink URI.
 * 1. Get payment options
 * 2. Prompt user to select supported payment option wallet
 * 3. Make preliminary transaction hexes to pass onto BitPay for verification
 * 4. Pass transaction to spend scene for confirmation and broadcast
 */
export async function launchBitPay(dispatch: Dispatch, uri: string, currencyWallets: { [walletId: string]: EdgeCurrencyWallet }): Promise<void> {
  // Fetch payment options
  let responseJson = await fetchBitPayJsonResponse(uri, {
    method: 'GET',
    headers: { Accept: 'application/payment-options', 'x-paypro-version': '2' }
  })
  const optionsResponse = asBpOptionsResponse(responseJson)
  const paymentId = optionsResponse.paymentId
  const options = optionsResponse.paymentOptions
  const isTestBp = uri.includes('test.bitpay.com')
  const paymentCurrencies: string[] = options
    .map<any>(po => po.currency)
    .filter(currency => {
      // Omit 'BTC' if using BitPay testnet, since our testnet BTC has its own currency code.
      return SPECIAL_CURRENCY_INFO[currency]?.isBitPayProtocolSupported && !(isTestBp && currency === 'BTC')
    })

  // Add our test BTC currency code for BitPay testnet
  if (isTestBp) {
    paymentCurrencies.push('TESTBTC')
  }

  // Select payment wallet
  const walletListResult = await Airship.show(bridge => (
    <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={paymentCurrencies} />
  ))
  const { walletId, currencyCode } = walletListResult
  if (!walletId || !currencyCode) {
    // No wallet selected
    return
  }

  // Normalize our test BTC currency code with BitPay's expectation
  const requestCurrencyCode = isTestBp && currencyCode === 'TESTBTC' ? 'BTC' : currencyCode

  // Fetch the invoice (payment-request) instructions
  const initOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/payment-request', 'x-paypro-version': '2' },
    body: JSON.stringify({
      chain: requestCurrencyCode,
      currency: requestCurrencyCode
    })
  }
  responseJson = await fetchBitPayJsonResponse(uri, initOpts)

  // Validate invoice data
  const invoiceResponse = asBpInvoiceResponse(responseJson)
  let errorData = { uri, initOpts, responseJson, invoiceResponse }
  if (invoiceResponse.instructions.length > 1) {
    throw new BitPayError(BitPayErrorCode.MultiInstructionInvoice, { errorData })
  }
  const invoiceInstruction = invoiceResponse.instructions[0]
  errorData = { ...errorData, invoiceInstruction }
  if (invoiceInstruction.outputs) {
    if (invoiceInstruction.outputs.length > 1) {
      throw new BitPayError(BitPayErrorCode.MultiOutputInvoice, { errorData })
    }
  } else throw new BitPayError(BitPayErrorCode.EmptyOutputInvoice, { errorData })
  const instructionOutput = invoiceInstruction.outputs[0]

  // Make the spend to generate the tx hexes
  const spendInfo: EdgeSpendInfo = {
    currencyCode,
    customNetworkFee: { satsPerByte: invoiceInstruction.requiredFeeRate },
    spendTargets: [
      {
        nativeAmount: instructionOutput.amount.toString(),
        publicAddress: instructionOutput.address
      }
    ]
  }
  const wallet = currencyWallets[walletId]
  const unsignedTx = await wallet.makeSpend(spendInfo)
  const unsignedHex = unsignedTx.otherParams?.txJson?.hex ?? ''
  const signedTx = await wallet.signTx(unsignedTx)
  const signedHex = signedTx.signedTx ?? ''

  errorData = { ...errorData, spendInfo, walletId, unsignedTx, signedTx }
  if (unsignedHex === '' || signedHex === '') throw new BitPayError(BitPayErrorCode.EmptyVerificationHexReq, errorData)

  // Send the unsigned TX and signed weightedSize to BitPay for validation
  const verificationPaymentRequest = {
    chain: requestCurrencyCode,
    currency: requestCurrencyCode,
    transactions: [{ tx: unsignedHex, weightedSize: signedHex.length }]
  }
  responseJson = await fetchBitPayJsonResponse(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/payment-verification',
      'x-paypro-version': '2'
    },
    body: JSON.stringify(verificationPaymentRequest)
  })

  // Verify that the transaction data reply matches
  const verificationPaymentResponse = asBpVerificationResponse(responseJson).payment
  if (verificationPaymentResponse.transactions.length !== 1 || unsignedHex !== verificationPaymentResponse.transactions[0].tx) {
    errorData = { ...errorData, verificationPaymentRequest, verificationPaymentResponse }
    errorData.responseJson = responseJson
    throw new BitPayError(BitPayErrorCode.TxVerificationMismatch, errorData)
  }

  // Pass spend info to the send scene for user to confirm tx
  const spendTarget = spendInfo.spendTargets[0]
  const guiMakeSpendInfo = {
    currencyCode,
    nativeAmount: spendTarget.nativeAmount,
    publicAddress: spendTarget.publicAddress,
    networkFeeOption: 'standard',
    metadata: {
      name: sprintf(s.strings.bitpay_metadata_name, paymentId),
      notes: paymentId
    },
    dismissAlert: true,
    lockInputs: true,
    onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
      if (error) showError(`${s.strings.create_wallet_account_error_sending_transaction}: ${error.message}`)
      Actions.pop()
    }
  }
  Actions.push('send', {
    guiMakeSpendInfo,
    selectedWalletId: walletId,
    selectedCurrencyCode: currencyCode
  })
}

/**
 * BitPay Cleaners
 */

const asBpOption: Cleaner<BpOption> = asObject({
  chain: asString,
  currency: asString,
  network: asString,
  estimatedAmount: asNumber,
  requiredFeeRate: asNumber,
  minerFee: asNumber,
  decimals: asNumber,
  selected: asBoolean
})

const asBpOptionsResponse: Cleaner<BpOptionsResponse> = asObject({
  time: asDate,
  expires: asDate,
  memo: asString,
  paymentUrl: asString,
  paymentId: asString,
  paymentOptions: asArray(asBpOption)
})

const asBpInstructionOutput: Cleaner<BpInstructionOutput> = asObject({
  amount: asNumber,
  address: asString,
  invoiceID: asOptional(asString)
})

const asBpInvoiceInstruction: Cleaner<BpInvoiceInstruction> = asObject({
  type: asString,
  requiredFeeRate: asMaybe(asNumber),
  outputs: asOptional(asArray(asBpInstructionOutput)),
  value: asMaybe(asNumber),
  to: asOptional(asString),
  data: asOptional(asString),
  gasPrice: asMaybe(asNumber)
})

const asBpInvoiceResponse: Cleaner<BpInvoiceResponse> = asObject({
  time: asDate,
  expires: asDate,
  memo: asString,
  paymentUrl: asString,
  paymentId: asString,
  chain: asString,
  network: asString,
  instructions: asArray(asBpInvoiceInstruction),
  currency: asOptional(asString)
})

const asBpTransaction: Cleaner<BpTransaction> = asObject({
  tx: asString
})

const asBpVerificationPayment: Cleaner<BpVerificationPayment> = asObject({
  currency: asString,
  chain: asString,
  transactions: asArray(asBpTransaction)
})

const asBpVerificationResponse: Cleaner<BpVerificationResponse> = asObject({
  payment: asBpVerificationPayment,
  memo: asString
})
