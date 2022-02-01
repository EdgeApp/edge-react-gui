// @flow

import { sprintf } from 'sprintf-js'

import s from '../locales/strings.js'

/** Explains BitPay Error options */
type BitPayErrorOptions = {
  header?: string,
  statusCode?: string,
  text?: string,
  errorData?: Object
}

/** Alias for BitPay error handler function */
type BitPayErrorHandler = (error: BitPayErrorOptions) => string

export const BitPayErrorCode = {
  CurrencyNotSupported: 'CurrencyNotSupported',
  EmptyOutputInvoice: 'EmptyOutputInvoice',
  EmptyVerificationHexReq: 'EmptyVerificationHexReq',
  FetchFailed: 'FetchFailed',
  InvalidPaymentOption: 'InvalidPaymentOption',
  MultiOutputInvoice: 'MultiOutputInvoice',
  MultiInstructionInvoice: 'MultiInstructionInvoice',
  NoPaymentOption: 'NoPaymentOption',
  TxVerificationMismatch: 'TxVerificationMismatch'
}

/**
 * @internal
 * Internal Mapping object from BitPayErrorCode to a BitPayErrorHandler
 */
const HandlersByCode = {
  [BitPayErrorCode.CurrencyNotSupported]: (params: { text: string }) => sprintf(s.strings.error_bitpay_currency_not_supported, params.text),
  [BitPayErrorCode.EmptyOutputInvoice]: () => s.strings.error_bitpay_empty_output_invoice,
  [BitPayErrorCode.EmptyVerificationHexReq]: () => s.strings.error_bitpay_empty_verification_hex_req,
  [BitPayErrorCode.FetchFailed]: (params: { header: string, statusCode: string, text?: string }) =>
    sprintf(s.strings.error_bitpay_fetch, params.header, params.statusCode, params.text ?? ''),
  [BitPayErrorCode.InvalidPaymentOption]: (params: { text: string }) => sprintf(s.strings.error_bitpay_invalid_payment_option, params.text),
  [BitPayErrorCode.MultiOutputInvoice]: () => s.strings.error_bitpay_multi_output_invoice,
  [BitPayErrorCode.MultiInstructionInvoice]: () => s.strings.error_bitpay_multi_tx_invoice,
  [BitPayErrorCode.NoPaymentOption]: (params: { text: string }) => sprintf(s.strings.error_bitpay_no_payment_option, params.text),
  [BitPayErrorCode.TxVerificationMismatch]: () => sprintf(s.strings.error_bitpay_tx_verification_failed)
}

/**
 * BitPay Error class is designed to control every error being thrown by BitPay
 * @param code - Error Code
 * - CurrencyNotSupported - The invoice only wants coins the app doesn't support.
 * - EmptyOutputInvoice - Invoice response contained no target output
 * - EmptyVerificationHexReq - No hex strings generated for verification request
 * - FetchFailed - Fetch returned status other than 200
 * - InvalidPaymentOption - Payment currency not accepted when paying through a
 *   wallet's send scene
 * - MultiOutputInvoice - Invoice response asking for multiple outputs
 * - MultiInstructionInvoice - Invoice response gives multiple payment instructions
 * - NoPaymentOption - User holds no currencies that are accepted by the invoice
 * - TxVerificationMismatch - BitPay's tx verification response doesn't match our request
 * @param header: Headers attached to the fetch request
 * @param statusCode: Numeric status code from fetch
 * @param text: Text data from failed fetch
 * @param errorData: Any other debug data of interest
 */
export class BitPayError extends Error {
  code: string
  header: string
  statusCode: string
  text: string
  errorData: Object

  constructor(code: string, options: BitPayErrorOptions) {
    const bitPayErrorHandler: BitPayErrorHandler = HandlersByCode[code]
    const { header, statusCode, text, errorData } = options
    super(bitPayErrorHandler({ header, statusCode, text, errorData }))
    this.code = code
    this.header = header ?? ''
    this.statusCode = statusCode ?? ''
    this.name = 'BitPayError'
    this.errorData = errorData ?? {}
    Object.setPrototypeOf(this, BitPayError.prototype)
  }
}
