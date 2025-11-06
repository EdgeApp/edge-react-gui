// Payment type display name mapping based on plugin configurations
const paymentTypeDisplayNames: Record<string, string> = {
  ach: 'ACH Bank Transfer',
  applepay: 'Apple Pay',
  bank: 'Bank Transfer',
  cash: 'In-person Cash and Debit Card',
  colombiabank: 'Colombia Bank Transfer',
  credit: 'Credit and Debit Card',
  debit: 'Debit Card',
  directtobank: 'Direct to Bank',
  fasterpayments: 'Faster Payments',
  googlepay: 'Google Pay',
  iach: 'Instant ACH Bank Transfer',
  ideal: 'iDEAL',
  interac: 'Interac e-Transfer',
  iobank: 'Bank Transfer',
  mexicobank: 'Mexico Bank Transfer',
  payid: 'PayID',
  paypal: 'Paypal',
  pix: 'PIX',
  pse: 'PSE Payment',
  revolut: 'Revolut',
  sepa: 'SEPA Bank Transfer',
  spei: 'SPEI Bank Transfer',
  turkishbank: 'Turkish Bank Transfer',
  venmo: 'Venmo',
  wire: 'Bank Wire Transfer'
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
