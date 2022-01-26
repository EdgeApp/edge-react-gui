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
  EmptyOutputInvoice: 'EmptyOutputInvoice',
  EmptyVerificationHexReq: 'EmptyVerificationHexReq',
  FetchFailed: 'FetchFailed',
  MultiOutputInvoice: 'MultiOutputInvoice',
  MultiInstructionInvoice: 'MultiInstructionInvoice',
  TxVerificationMismatch: 'TxVerificationMismatch'
}

/**
 * @internal
 * Internal Mapping object from BitPayErrorCode to a BitPayErrorHandler
 */
const HandlersByCode = {
  [BitPayErrorCode.EmptyOutputInvoice]: () => s.strings.error_bitpay_empty_output_invoice,
  [BitPayErrorCode.EmptyVerificationHexReq]: () => s.strings.error_bitpay_empty_verification_hex_req,
  [BitPayErrorCode.FetchFailed]: (params: { header: string, statusCode: string, text: string }) =>
    sprintf(s.strings.error_bitpay_fetch, params.header, params.statusCode, params.text),
  [BitPayErrorCode.MultiOutputInvoice]: () => s.strings.error_bitpay_multi_output_invoice,
  [BitPayErrorCode.MultiInstructionInvoice]: () => s.strings.error_bitpay_multi_tx_invoice,
  [BitPayErrorCode.TxVerificationMismatch]: () => sprintf(s.strings.error_bitpay_tx_verification_failed)
}

/**
 * BitPay Error class is designed to control every error being thrown by BitPay
 * @param code - Error Code
 * - EmptyOutputInvoice - Invoice response contained no target output
 * - EmptyVerificationHexReq - No hex strings generated for verification request
 * - FetchFailed - Fetch returned status other than 200
 * - MultiOutputInvoice - Invoice response asking for multiple outputs
 * - MultiInstructionInvoice - Invoice response gives multiple payment instructions
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
