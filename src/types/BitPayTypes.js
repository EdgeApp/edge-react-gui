// @flow

/**
 * Response for the BitPay 'application/payment-option'.
 * These are the supported payment options to the BitPay v2 protocol.
 */

export type BpOption = {
  chain: string,
  currency: string,
  network: string,
  estimatedAmount: number,
  requiredFeeRate: number,
  minerFee: number,
  decimals: number,
  selected: boolean
}

export type BpOptionsResponse = {
  time: Date,
  expires: Date,
  memo: string,
  paymentUrl: string,
  paymentId: string,
  paymentOptions: BpOption[]
}

/**
 * Response for the BitPay 'application/payment-request'.
 * This tells us how to fulfill a BitPay invoice: Payment address, network
 * fee requirements, etc.
 */

export type BpInstructionOutput = {
  amount: number,
  address: string,
  invoiceID?: string
}

export type BpInvoiceInstruction = {
  type: string,
  requiredFeeRate?: number,
  outputs?: BpInstructionOutput[],
  value?: number,
  to?: string,
  data?: string,
  gasPrice?: number
}

export type BpInvoiceResponse = {
  time: Date,
  expires: Date,
  memo: string,
  paymentUrl: string,
  paymentId: string,
  chain: string,
  network: string,
  instructions: BpInvoiceInstruction[],
  currency?: string
}

/**
 * Response format for the BitPay 'application/payment-verification'.
 * This tells us whether BitPay thinks our tx is valid, ensuring our broadcast
 * will be accepted by them.
 */

export type BpTransaction = {
  tx: string
}

export type BpVerificationPayment = {
  currency: string,
  chain: string,
  transactions: BpTransaction[]
}

export type BpVerificationResponse = {
  payment: BpVerificationPayment,
  memo: string
}
