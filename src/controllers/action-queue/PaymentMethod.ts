export interface PaymentMethod {
  id: string
  name: string
  defaultCurrency: string
  status: string
  supportsDeposit: boolean
  supportsPayment: boolean
  blockchains: Record<string, string>
}

export type PaymentMethodsMap = Record<string, PaymentMethod>
