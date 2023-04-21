import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'

export type PaymentProtoErrorCode =
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
 * Options passed to the PaymentProtoError constructor.
 */
interface PaymentProtoErrorOptions {
  header?: string
  statusCode?: string
  text?: string
  errorData?: any
}

/**
 * PaymentProtoError class is designed to control every error being thrown by the
 * JSON Payment Protocol
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
 * - TxVerificationMismatch - Payment Protocol's tx verification response doesn't
 *   match our request
 * @param header: Headers attached to the fetch request
 * @param statusCode: Numeric status code from fetch
 * @param text: Text data from failed fetch
 * @param errorData: Any other debug data of interest
 */
export class PaymentProtoError extends Error {
  code: PaymentProtoErrorCode
  header: string
  statusCode: string
  text: string
  errorData: any

  constructor(code: PaymentProtoErrorCode, options: PaymentProtoErrorOptions) {
    const { header = '', statusCode = '', text = '', errorData = {} } = options
    super(code)
    this.name = 'PaymentProtoError'
    this.code = code
    this.header = header
    this.statusCode = statusCode
    this.text = text
    this.errorData = errorData
  }
}

export function translatePaymentProtoError(error: PaymentProtoError): string {
  switch (error.code) {
    case 'CurrencyNotSupported':
      return sprintf(lstrings.error_paymentprotocol_currency_not_supported, error.text)
    case 'EmptyOutputInvoice':
      return lstrings.error_paymentprotocol_empty_output_invoice
    case 'EmptyVerificationHexReq':
      return lstrings.error_paymentprotocol_empty_verification_hex_req
    case 'FetchFailed':
      return sprintf(lstrings.error_paymentprotocol_fetch, error.header, error.statusCode, error.text)
    case 'InvalidPaymentOption':
      return sprintf(lstrings.error_paymentprotocol_invalid_payment_option, error.text)
    case 'MultiOutputInvoice':
      return lstrings.error_paymentprotocol_multi_output_invoice
    case 'MultiInstructionInvoice':
      return lstrings.error_paymentprotocol_multi_tx_invoice
    case 'NoPaymentOption':
      return sprintf(lstrings.error_paymentprotocol_no_payment_option, error.text)
    case 'TxVerificationMismatch':
      return sprintf(lstrings.error_paymentprotocol_tx_verification_failed)
    default:
      return error.message
  }
}
