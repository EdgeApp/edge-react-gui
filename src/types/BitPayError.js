// @flow

import { sprintf } from 'sprintf-js'

import s from '../locales/strings.js'

export type BitPayErrorCode =
  | 'CurrencyNotSupported'
  | 'EmptyOutputInvoice'
  | 'EmptyVerificationHexReq'
  | 'FetchFailed'
  | 'InvalidPaymentOption'
  | 'MultiOutputInvoice'
  | 'MultiInstructionInvoice'
  | 'NoPaymentOption'
  | 'TxVerificationMismatch'

/**
 * Options passed to the BitPayError constructor.
 */
type BitPayErrorOptions = {|
  header?: string,
  statusCode?: string,
  text?: string,
  errorData?: Object
|}

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
  code: BitPayErrorCode
  header: string
  statusCode: string
  text: string
  errorData: Object

  constructor(code: BitPayErrorCode, options: BitPayErrorOptions) {
    const { header = '', statusCode = '', text = '', errorData = {} } = options
    super(code)
    this.name = 'BitPayError'
    this.code = code
    this.header = header
    this.statusCode = statusCode
    this.text = text
    this.errorData = errorData
  }
}

export function translateBitPayError(error: BitPayError): string {
  switch (error.code) {
    case 'CurrencyNotSupported':
      return sprintf(s.strings.error_bitpay_currency_not_supported, error.text)
    case 'EmptyOutputInvoice':
      return s.strings.error_bitpay_empty_output_invoice
    case 'EmptyVerificationHexReq':
      return s.strings.error_bitpay_empty_verification_hex_req
    case 'FetchFailed':
      return sprintf(s.strings.error_bitpay_fetch, error.header, error.statusCode, error.text)
    case 'InvalidPaymentOption':
      return sprintf(s.strings.error_bitpay_invalid_payment_option, error.text)
    case 'MultiOutputInvoice':
      return s.strings.error_bitpay_multi_output_invoice
    case 'MultiInstructionInvoice':
      return s.strings.error_bitpay_multi_tx_invoice
    case 'NoPaymentOption':
      return sprintf(s.strings.error_bitpay_no_payment_option, error.text)
    case 'TxVerificationMismatch':
      return sprintf(s.strings.error_bitpay_tx_verification_failed)
    default:
      return error.message
  }
}
