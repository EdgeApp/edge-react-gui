/**
 * Response for the Payment Protocol 'application/payment-option'.
 * These are the supported payment options to the v2 Payment Protocol.
 */

export interface PaymentProtoOption {
  chain: string
  currency: string
  network: string
  estimatedAmount: number
  requiredFeeRate: number
  minerFee: number
  decimals: number
  selected: boolean
}

export interface PaymentProtoOptionsResponse {
  time: Date
  expires: Date
  memo: string
  paymentUrl: string
  paymentId: string
  paymentOptions: PaymentProtoOption[]
}

/**
 * Response for the Payment Protocol 'application/payment-request'.
 * This tells us how to fulfill a Payment Protocol invoice: Payment address, network
 * fee requirements, etc.
 */

export interface PaymentProtoInstructionOutput {
  amount: number
  address: string
  invoiceID?: string
}

export interface PaymentProtoInvoiceInstruction {
  type: string
  requiredFeeRate?: number
  outputs?: PaymentProtoInstructionOutput[]
  value?: number
  to?: string
  data?: string
  gasPrice?: number
}

export interface PaymentProtoInvoiceResponse {
  time: Date
  expires: Date
  memo: string
  paymentUrl: string
  paymentId: string
  chain: string
  network: string
  instructions: PaymentProtoInvoiceInstruction[]
  currency?: string
}

/**
 * Response format for the JSON Payment Protocol 'application/payment-verification'.
 * This tells us whether the Payment Protocol thinks our tx is valid, ensuring our broadcast
 * will be accepted by them.
 */

export interface PaymentProtoTransaction {
  tx: string
}

export interface PaymentProtoVerificationPayment {
  transactions: PaymentProtoTransaction[]
}

export interface PaymentProtoVerificationResponse {
  payment: PaymentProtoVerificationPayment
  memo: string
}
