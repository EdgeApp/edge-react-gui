import { lstrings } from '../locales/strings'

// Payment type display name mapping based on plugin configurations
const paymentTypeDisplayNames: Record<string, string> = {
  ach: lstrings.ach_bank_transfer,
  applepay: lstrings.apple_pay,
  bank: lstrings.bank_transfer,
  cash: lstrings.in_person_cash_and_debit_card,
  colombiabank: lstrings.colombia_bank_transfer,
  credit: lstrings.credit_and_debit_card,
  debit: lstrings.debit_card,
  directtobank: lstrings.direct_to_bank,
  fasterpayments: lstrings.faster_payments,
  googlepay: lstrings.google_pay,
  iach: lstrings.instant_ach_bank_transfer,
  ideal: lstrings.ideal,
  interac: lstrings.interac_e_transfer,
  iobank: lstrings.bank_transfer,
  mexicobank: lstrings.mexico_bank_transfer,
  payid: lstrings.payid,
  paypal: lstrings.paypal,
  pix: lstrings.pix,
  pse: lstrings.pse_payment,
  revolut: lstrings.revolut,
  sepa: lstrings.sepa_bank_transfer,
  spei: lstrings.spei_bank_transfer,
  turkishbank: lstrings.turkish_bank_transfer,
  venmo: lstrings.venmo,
  wire: lstrings.bank_wire_transfer
}

/**
 * Get the display name for a payment type
 * @param paymentType - The payment type identifier
 * @returns The human-readable display name
 */
export const getPaymentTypeDisplayName = (paymentType: string): string => {
  return paymentTypeDisplayNames[paymentType] ?? paymentType
}

/**
 * Format multiple payment types into a display string
 * @param paymentTypes - Array of payment type identifiers
 * @returns Formatted string of payment type display names
 */
export const formatPaymentTypes = (paymentTypes: string[]): string => {
  if (paymentTypes.length === 0) return ''

  const displayNames = paymentTypes.map(type => getPaymentTypeDisplayName(type))

  if (displayNames.length === 1) return displayNames[0]
  if (displayNames.length === 2) return displayNames.join(' or ')

  // For 3+ items: "Item1, Item2, or Item3"
  const lastItem = displayNames.pop()
  return `${displayNames.join(', ')}, or ${lastItem}`
}
