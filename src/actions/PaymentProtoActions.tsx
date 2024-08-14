import { asArray, asBoolean, asDate, asMaybe, asNumber, asObject, asOptional, asString, Cleaner } from 'cleaners'
import { EdgeAccount, EdgeCurrencyWallet, EdgeMetadata, EdgeSpendInfo, EdgeTokenId, EdgeTransaction } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { ErrorNoMatchingWallets, pickWallet } from '../components/modals/WalletListModal'
import { SendScene2Params } from '../components/scenes/SendScene2'
import { showError } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
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
import { NavigationBase } from '../types/routerTypes'
import { EdgeAsset, MapObject, StringMap } from '../types/types'

export interface LaunchPaymentProtoParams {
  wallet?: EdgeCurrencyWallet
  tokenId?: EdgeTokenId
  metadata?: EdgeMetadata
  hideScamWarning?: boolean

  // User is already on SendScene2 and router should replace vs navigate
  navigateReplace?: boolean

  onBack?: () => void
  onDone?: (edgeTransaction?: EdgeTransaction) => void
}

// Maps payment protocol chain ids to Edge currency pluginIds
const CHAIN_MAP: StringMap = {
  ARB: 'arbitrum',
  BASE: 'base',
  BCH: 'bitcoincash',
  BSV: 'bitcoinsv',
  BTC: 'bitcoin',
  DASH: 'dash',
  DOGE: 'dogecoin',
  ETH: 'ethereum',
  LTC: 'litecoin',
  MATIC: 'polygon',
  OP: 'optimism',
  XMR: 'monero',
  XRP: 'ripple'
}

// https://developer.bitpay.com/reference/retrieve-the-supported-currencies
// https://anypayx.com/coins
export const PAYMENT_PROTOCOL_MAP: MapObject<EdgeAsset> = {
  ETH_arb: { pluginId: 'arbitrum', tokenId: null },
  USDC_arb: { pluginId: 'arbitrum', tokenId: 'af88d065e77c8cc2239327c5edb3a432268e5831' },
  USDTe_arb: { pluginId: 'arbitrum', tokenId: 'fd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
  ETH_base: { pluginId: 'base', tokenId: null },
  USDC_base: { pluginId: 'base', tokenId: '833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
  BTC: { pluginId: 'bitcoin', tokenId: null },
  BCH: { pluginId: 'bitcoincash', tokenId: null },
  BSV: { pluginId: 'bitcoinsv', tokenId: null },
  DASH: { pluginId: 'dash', tokenId: null },
  ETH: { pluginId: 'ethereum', tokenId: null },
  APE: { pluginId: 'ethereum', tokenId: '4d224452801aced8b2f0aebe155379bb5d594381' },
  BUSD: { pluginId: 'ethereum', tokenId: '4fabb145d64652a948d72533023f6e7a623c7c53' },
  DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
  EUROC: { pluginId: 'ethereum', tokenId: '1abaea1f7c830bd89acc67ec4af516284b1bc33c' },
  GUSD: { pluginId: 'ethereum', tokenId: '056fd409e1d7a124bd7017459dfea2f387b6d5cd' },
  MATIC_e: { pluginId: 'ethereum', tokenId: '7d1afa7b718fb893db30a3abc0cfc608aacfebb0' },
  PAX: { pluginId: 'ethereum', tokenId: '8e870d67f660d95d5be530380d0ec0bd388289e1' },
  PYUSD: { pluginId: 'ethereum', tokenId: '6c3ea9036406852006290770bedfcaba0e23a0e8' },
  SHIB: { pluginId: 'ethereum', tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  USDT: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
  WBTC: { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  DOGE: { pluginId: 'dogecoin', tokenId: null },
  LTC: { pluginId: 'litecoin', tokenId: null },
  ETH_op: { pluginId: 'optimism', tokenId: null },
  USDC_op: { pluginId: 'optimism', tokenId: '0b2c639c533813f4aa9d7837caf62653d097ff85' },
  USDTe_op: { pluginId: 'optimism', tokenId: '94b008aa00579c1307b0ef2c499ad98a8ce58e58' },
  XMR: { pluginId: 'monero', tokenId: null },
  MATIC: { pluginId: 'polygon', tokenId: null },
  BUSD_m: { pluginId: 'polygon', tokenId: 'dab529f40e671a1d4bf91361c21bf9f0c9712ab7' },
  DAI_m: { pluginId: 'polygon', tokenId: '8f3cf7ad23cd3cadbd9735aff958023239c6a063' },
  ETH_m: { pluginId: 'polygon', tokenId: '7ceb23fd6bc0add59e62ac25578270cff1b9f619' },
  SHIB_m: { pluginId: 'polygon', tokenId: '6f8a06447ff6fcf75d803135a7de15ce88c1d4ec' },
  USDC_m: { pluginId: 'polygon', tokenId: '2791bca1f2de4661ed88a30c99a7a9449aa84174' },
  USDCn_m: { pluginId: 'polygon', tokenId: '3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
  USDT_m: { pluginId: 'polygon', tokenId: 'c2132d05d31c914a87c6611c10748aeb04b58e8f' },
  WBTC_m: { pluginId: 'polygon', tokenId: '1bfd67037b42cf73acf2047067bd4f2c47d9bfd6' },
  XRP: { pluginId: 'ripple', tokenId: null }
}

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

/**
 * Handles the Payment Protocol scanned or deeplink URI.
 * 1. Get payment options
 * 2. Prompt user to select supported payment option wallet OR
 *    validate calling core wallet is an accepted payment option
 * 3. Make preliminary transaction hexes to pass onto the Payment Protocol for verification
 * 4. Pass transaction to spend scene for confirmation and broadcast
 */
export async function launchPaymentProto(navigation: NavigationBase, account: EdgeAccount, uri: string, params: LaunchPaymentProtoParams): Promise<void> {
  const { currencyWallets } = account
  const { hideScamWarning, metadata = {}, navigateReplace, tokenId: tokenIdParam = null, wallet, onBack, onDone } = params
  // Fetch payment options
  let responseJson = await fetchPaymentProtoJsonResponse(uri, {
    method: 'GET',
    headers: { Accept: 'application/payment-options', 'x-paypro-version': '2' }
  })
  const optionsResponse = asPaymentProtoOptionsResponse(responseJson)
  const paymentId = optionsResponse.paymentId
  const paymentAssets: EdgeAsset[] = []
  const paymentCurrencies: string[] = optionsResponse.paymentOptions.map(option => option.currency)

  for (const currency of paymentCurrencies) {
    if (PAYMENT_PROTOCOL_MAP[currency] == null) continue
    paymentAssets.push(PAYMENT_PROTOCOL_MAP[currency])
  }

  // Select payment wallet, if this wasn't called directly from a wallet's
  // send scene
  let selectedWallet: EdgeCurrencyWallet
  let selectedAsset: EdgeAsset
  if (wallet != null) {
    // Ensure the core wallet is accepted by this invoice as a payment option
    const asset = paymentAssets.find(({ pluginId, tokenId }) => {
      const pluginIdMatches = pluginId === wallet.currencyInfo.pluginId
      if (!pluginIdMatches) return false
      if (tokenId == null) return true
      const tokenIdMatches = wallet.enabledTokenIds.includes(tokenId)
      return tokenIdMatches
    })
    if (asset == null) throw new PaymentProtoError('InvalidPaymentOption', { text: paymentCurrencies.join(', ') })
    selectedWallet = wallet
    selectedAsset = { pluginId: selectedWallet.currencyInfo.pluginId, tokenId: tokenIdParam }
  } else {
    const result = await pickWallet({ account, assets: paymentAssets, navigation }).catch(e => {
      if (e.message !== ErrorNoMatchingWallets) throw e
    })
    if (result?.type !== 'wallet') {
      throw new PaymentProtoError('NoPaymentOption', { text: paymentCurrencies.join(', ') })
    }
    const { walletId, tokenId } = result
    if (currencyWallets[walletId] == null) return
    selectedWallet = currencyWallets[walletId]
    selectedAsset = { pluginId: selectedWallet.currencyInfo.pluginId, tokenId }
  }

  const chain = Object.keys(CHAIN_MAP).find(chainCode => CHAIN_MAP[chainCode] === selectedWallet.currencyInfo.pluginId)
  const currency = Object.keys(PAYMENT_PROTOCOL_MAP).find(
    bitpayCode => PAYMENT_PROTOCOL_MAP[bitpayCode].pluginId === selectedAsset.pluginId && PAYMENT_PROTOCOL_MAP[bitpayCode].tokenId === selectedAsset.tokenId
  )
  if (chain == null || currency == null) throw new PaymentProtoError('InvalidPaymentOption', { text: paymentCurrencies.join(', ') })

  // Fetch the invoice (payment-request) instructions
  const initOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/payment-request', 'x-paypro-version': '2' },
    body: JSON.stringify({
      chain,
      currency
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

  const paymentIdString = sprintf(lstrings.bitpay_metadata_name, paymentId)
  metadata.notes = metadata.notes ? metadata.notes + '\n\n' + paymentIdString : paymentIdString

  // Make the spend to generate the tx hexes
  let requiredFeeRate = invoiceInstruction.requiredFeeRate
  // This is an additional buffer because the protocol doesn't discount segwit
  // transactions and we want to make sure the transaction succeeds.
  const { pluginId, tokenId } = selectedAsset

  if (typeof requiredFeeRate === 'number' && SPECIAL_CURRENCY_INFO[pluginId].hasSegwit) requiredFeeRate *= 1.8
  const spendInfo: EdgeSpendInfo = {
    tokenId,
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

  // RBF transactions aren't supported so it needs to be disabled
  if (selectedWallet.currencyInfo.canReplaceByFee) {
    Object.assign(spendInfo, {
      otherParams: {
        enableRbf: false
      }
    })
  }

  if (requiredFeeRate != null) {
    spendInfo.networkFeeOption = 'custom'
    spendInfo.customNetworkFee = { satPerByte: Math.ceil(requiredFeeRate) }
  }

  const sendParams: SendScene2Params = {
    walletId: selectedWallet.id,
    hiddenFeaturesMap: {
      scamWarning: hideScamWarning
    },
    spendInfo,
    tokenId,
    lockTilesMap: { amount: true, address: true, fee: requiredFeeRate != null },
    onBack,
    onDone: async (error: Error | null, edgeTransaction?: EdgeTransaction) => {
      if (error) showError(`${lstrings.create_wallet_account_error_sending_transaction}: ${error.message}`)
      if (onDone != null) onDone(edgeTransaction)
    },
    alternateBroadcast: async (edgeTransaction: EdgeTransaction) => {
      const unsignedHex = edgeTransaction.otherParams?.unsignedTx
      const signedHex = edgeTransaction.signedTx
      errorData = { ...errorData, spendInfo, walletId: selectedWallet?.id, edgeTransaction }

      if (selectedWallet == null) throw new Error('Missing selectedWallet')
      if (unsignedHex === '' || signedHex === '') throw new PaymentProtoError('EmptyVerificationHexReq', { errorData })

      const verificationPaymentRequest = {
        chain,
        currency,
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
          chain,
          currency,
          transactions: [{ tx: edgeTransaction.signedTx, weightedSize: signedHex.length / 2 }]
        })
      })
      return await selectedWallet.broadcastTx(edgeTransaction)
    }
  }
  if (navigateReplace === true) {
    navigation.replace('send2', sendParams)
  } else {
    navigation.navigate('send2', sendParams)
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
  transactions: asArray(asPaymentProtoTransaction)
})

const asPaymentProtoVerificationResponse: Cleaner<PaymentProtoVerificationResponse> = asObject({
  payment: asPaymentProtoVerificationPayment,
  memo: asString
})
