export interface PaymentMethod {
  id: string
  name: string
  defaultCurrency: string
  status: string
  supportsDeposit: boolean
  supportsPayment: boolean
  blockchains: { [key: string]: string }
}

export interface PaymentMethodsMap {
  [key: string]: PaymentMethod
}
