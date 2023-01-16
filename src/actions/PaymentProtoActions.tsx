import { asArray, asBoolean, asDate, asMaybe, asNumber, asObject, asOptional, asString, Cleaner } from 'cleaners'
import { EdgeAccount, EdgeCurrencyWallet, EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { WalletListModal, WalletListResult } from '../components/modals/WalletListModal'
import { SendScene2Params } from '../components/scenes/SendScene2'
import { Airship, showError } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import { PaymentProtoError } from '../types/PaymentProtoError'
import {
  PaymentProtoInstructionOutput,
  PaymentProtoInvoiceInstruction,
  PaymentProtoInvoiceResponse,
  PaymentProtoOption,
  PaymentProtoOptionsResponse,
  PaymentProtoTransaction,
  PaymentProtoVerificationPayment,
  PaymentProtoVerificationResponse
} from '../types/PaymentProtoTypes'
import { Actions, NavigationBase } from '../types/routerTypes'
import { getTokenId } from '../util/CurrencyInfoHelpers'

/**
 * Performs the fetch commands to the Payment Protocol.
 * Throws errors when response is not OK.
 */
async function fetchPaymentProtoJsonResponse(uri: string, init: object): Promise<Response> {
  const fetchResponse = await fetch(uri, init)
  if (!fetchResponse.ok || fetchResponse.status !== 200) {
    const statusCode = fetchResponse.status.toString()
    // @ts-expect-error
    const typeHack: any = init.headers
    const headers = typeHack
    // @ts-expect-error
    const body = init.body ? JSON.stringify(init.body) : ''
    // @ts-expect-error
    const method = init.method

    // Parse a useful header string
    let header = ''
    if (headers.Accept) header = headers.Accept
    else if (headers['Content-Type']) header = headers['Content-Type']
    const trimmedHeader = 'application/'
    if (header.includes(trimmedHeader)) header = header.split(trimmedHeader)[1]

    // Content-always gives text/html, regardless of if it's a useful
    // message or a webpage.
    // Only show the text in the error response if not a web page.
    const rawText = await fetchResponse.text()
    const text = !rawText.includes('doctype html') ? `: ${rawText}` : ''
    throw new PaymentProtoError('FetchFailed', { header, statusCode, text, errorData: { uri, method, body, rawText } })
  }

  return await fetchResponse.json()
}

const paymentProtoSupportedCurrencyCodes = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].isPaymentProtocolSupported ?? false)
  .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)

/**
 * Handles the Payment Protocol scanned or deeplink URI.
 * 1. Get payment options
 * 2. Prompt user to select supported payment option wallet OR
 *    validate calling core wallet is an accepted payment option
 * 3. Make preliminary transaction hexes to pass onto the Payment Protocol for verification
 * 4. Pass transaction to spend scene for confirmation and broadcast
 */
export async function launchPaymentProto(
  navigation: NavigationBase,
  account: EdgeAccount,
  uri: string,
  params: {
    wallet?: EdgeCurrencyWallet
    currencyWallets?: { [walletId: string]: EdgeCurrencyWallet }
    metadata?: EdgeMetadata
  }
): Promise<void> {
  // Fetch payment options
  let responseJson = await fetchPaymentProtoJsonResponse(uri, {
    method: 'GET',
    headers: { Accept: 'application/payment-options', 'x-paypro-version': '2' }
  })
  const optionsResponse = asPaymentProtoOptionsResponse(responseJson)
  const paymentId = optionsResponse.paymentId
  const options = optionsResponse.paymentOptions
  const isTestPaymentProto = uri.toLowerCase().includes('test.bitpay.com')
  const paymentCurrencies: string[] = options
    .map<any>(po => po.currency)
    .filter(
      currency =>
        // Omit 'BTC' if using Payment Protocol testnet, since our testnet BTC has its own currency code.
        paymentProtoSupportedCurrencyCodes.includes(currency) && !(isTestPaymentProto && currency === 'BTC')
    )

  // Add our test BTC currency code for Payment Protocol testnet
  if (isTestPaymentProto) {
    paymentCurrencies.push('TESTBTC')
  }

  // Select payment wallet, if this wasn't called directly from a wallet's
  // send scene
  let selectedWallet: EdgeCurrencyWallet | undefined
  let selectedCurrencyCode: string | undefined
  if (params.wallet) {
    // Ensure the core wallet is accepted by this invoice as a payment option
    selectedCurrencyCode = params.wallet.currencyInfo.currencyCode
    if (!paymentCurrencies.includes(selectedCurrencyCode)) {
      throw new PaymentProtoError('InvalidPaymentOption', { text: paymentCurrencies.join(', ') })
    }
    selectedWallet = params.wallet
  } else {
    // Check if user owns any wallets that are accepted by the invoice
    const { currencyWallets = {} } = params
    const matchingWallets: string[] = Object.keys(currencyWallets).filter(key => paymentCurrencies.includes(currencyWallets[key].currencyInfo.currencyCode))
    if (matchingWallets.length === 0) {
      throw new PaymentProtoError('NoPaymentOption', { text: paymentCurrencies.join(', ') })
    } else {
      const walletListResult = await Airship.show<WalletListResult>(bridge => (
        <WalletListModal bridge={bridge} navigation={navigation} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={paymentCurrencies} />
      ))
      const { walletId, currencyCode } = walletListResult
      selectedCurrencyCode = currencyCode
      if (!walletId || !currencyCode || !params.currencyWallets) {
        // No wallet selected
        return
      } else {
        selectedWallet = params.currencyWallets[walletId]
      }
    }
  }
  if (selectedWallet == null) return

  // Normalize our test BTC currency code with the Payment Protocol Testnet's expectation
  const requestCurrencyCode = isTestPaymentProto && selectedCurrencyCode === 'TESTBTC' ? 'BTC' : selectedCurrencyCode

  // Fetch the invoice (payment-request) instructions
  const initOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/payment-request', 'x-paypro-version': '2' },
    body: JSON.stringify({
      chain: requestCurrencyCode,
      currency: requestCurrencyCode
    })
  }
  responseJson = await fetchPaymentProtoJsonResponse(uri, initOpts)

  // Validate invoice data
  const invoiceResponse = asPaymentProtoInvoiceResponse(responseJson)
  let errorData: any = { uri, initOpts, responseJson, invoiceResponse }
  if (invoiceResponse.instructions.length > 1) {
    throw new PaymentProtoError('MultiInstructionInvoice', { errorData })
  }
  const invoiceInstruction = invoiceResponse.instructions[0]
  errorData = { ...errorData, invoiceInstruction }
  if (!invoiceInstruction.outputs || invoiceInstruction.outputs.length === 0) {
    throw new PaymentProtoError('EmptyOutputInvoice', { errorData })
  }

  const metadata = params.metadata ?? {}
  const paymentIdString = sprintf(s.strings.bitpay_metadata_name, paymentId)
  metadata.notes = metadata.notes ? metadata.notes + '\n\n' + paymentIdString : paymentIdString

  // Make the spend to generate the tx hexes
  let requiredFeeRate = invoiceInstruction.requiredFeeRate
  // This is an additional buffer because the protocol doesn't discount segwit
  // transactions and we want to make sure the transaction succeeds.
  const { pluginId } = selectedWallet.currencyInfo
  if (typeof requiredFeeRate === 'number' && SPECIAL_CURRENCY_INFO[pluginId].hasSegwit) requiredFeeRate *= 1.8
  const spendInfo: EdgeSpendInfo = {
    currencyCode: selectedCurrencyCode,
    // Reverse the outputs since Anypay puts the merchant amount first. Making it last will have
    // amount shown in a large Amount Tile. Anypay fee will show compressed in a combined
    // address/amount Tile
    spendTargets: invoiceInstruction.outputs.reverse().map(output => {
      return {
        nativeAmount: output.amount.toString(),
        publicAddress: output.address
      }
    }),
    metadata
  }
  if (requiredFeeRate != null) {
    spendInfo.networkFeeOption = 'custom'
    spendInfo.customNetworkFee = { satPerByte: Math.ceil(requiredFeeRate) }
  }

  const sendParams: SendScene2Params = {
    walletId: selectedWallet.id,
    spendInfo,
    tokenId: getTokenId(account, selectedWallet.currencyInfo.pluginId, selectedCurrencyCode ?? selectedWallet.currencyInfo.currencyCode),
    lockTilesMap: { amount: true, address: true },
    onDone: async (error: Error | null, edgeTransaction?: EdgeTransaction) => {
      if (error) showError(`${s.strings.create_wallet_account_error_sending_transaction}: ${error.message}`)
      navigation.pop()
    },
    alternateBroadcast: async (edgeTransaction: EdgeTransaction) => {
      const unsignedHex = edgeTransaction.otherParams?.unsignedTx
      const signedHex = edgeTransaction.signedTx
      errorData = { ...errorData, spendInfo, walletId: selectedWallet?.id, edgeTransaction }

      if (selectedWallet == null) throw new Error('Missing selectedWallet')
      if (unsignedHex === '' || signedHex === '') throw new PaymentProtoError('EmptyVerificationHexReq', { errorData })

      const verificationPaymentRequest = {
        chain: requestCurrencyCode,
        currency: requestCurrencyCode,
        transactions: [{ tx: unsignedHex, weightedSize: signedHex.length / 2 }]
      }
      responseJson = await fetchPaymentProtoJsonResponse(uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/payment-verification',
          'x-paypro-version': '2'
        },
        body: JSON.stringify(verificationPaymentRequest)
      })

      // Verify that the transaction data reply matches
      const verificationPaymentResponse = asPaymentProtoVerificationResponse(responseJson).payment
      if (verificationPaymentResponse.transactions.length !== 1 || unsignedHex !== verificationPaymentResponse.transactions[0].tx) {
        errorData = { ...errorData, verificationPaymentRequest, verificationPaymentResponse }
        errorData.responseJson = responseJson
        throw new PaymentProtoError('TxVerificationMismatch', { errorData })
      }

      await fetchPaymentProtoJsonResponse(uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/payment',
          'x-paypro-version': '2'
        },
        body: JSON.stringify({
          chain: requestCurrencyCode,
          currency: requestCurrencyCode,
          transactions: [{ tx: edgeTransaction.signedTx, weightedSize: signedHex.length / 2 }]
        })
      })
      return await selectedWallet.broadcastTx(edgeTransaction)
    }
  }

  // Send confirmation scene
  if (Actions.currentScene === 'send2') {
    navigation.pop()
    navigation.push('send2', sendParams)
  } else {
    navigation.push('send2', sendParams)
  }
}

/**
 * Payment Protocol Cleaners
 */

const asPaymentProtoOption: Cleaner<PaymentProtoOption> = asObject({
  chain: asString,
  currency: asString,
  network: asString,
  estimatedAmount: asNumber,
  requiredFeeRate: asNumber,
  minerFee: asNumber,
  decimals: asNumber,
  selected: asBoolean
})

const asPaymentProtoOptionsResponse: Cleaner<PaymentProtoOptionsResponse> = asObject({
  time: asDate,
  expires: asDate,
  memo: asString,
  paymentUrl: asString,
  paymentId: asString,
  paymentOptions: asArray(asPaymentProtoOption)
})

const asPaymentProtoInstructionOutput: Cleaner<PaymentProtoInstructionOutput> = asObject({
  amount: asNumber,
  address: asString,
  invoiceID: asOptional(asString)
})

const asPaymentProtoInvoiceInstruction: Cleaner<PaymentProtoInvoiceInstruction> = asObject({
  type: asString,
  requiredFeeRate: asMaybe(asNumber),
  outputs: asOptional(asArray(asPaymentProtoInstructionOutput)),
  value: asMaybe(asNumber),
  to: asOptional(asString),
  data: asOptional(asString),
  gasPrice: asMaybe(asNumber)
})

const asPaymentProtoInvoiceResponse: Cleaner<PaymentProtoInvoiceResponse> = asObject({
  time: asDate,
  expires: asDate,
  memo: asString,
  paymentUrl: asString,
  paymentId: asString,
  chain: asString,
  network: asString,
  instructions: asArray(asPaymentProtoInvoiceInstruction),
  currency: asOptional(asString)
})

const asPaymentProtoTransaction: Cleaner<PaymentProtoTransaction> = asObject({
  tx: asString
})

const asPaymentProtoVerificationPayment: Cleaner<PaymentProtoVerificationPayment> = asObject({
  currency: asString,
  chain: asString,
  transactions: asArray(asPaymentProtoTransaction)
})

const asPaymentProtoVerificationResponse: Cleaner<PaymentProtoVerificationResponse> = asObject({
  payment: asPaymentProtoVerificationPayment,
  memo: asString
})
