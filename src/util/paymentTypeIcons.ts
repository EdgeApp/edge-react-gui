import type { FiatPaymentType } from '../plugins/gui/fiatPluginTypes'
import type { ImageProp, Theme } from '../types/Theme'

// Payment type to theme key mapping
// Note: Some payment types from GuiPluginListScene (auspost, bank, cash, debit, giftcard, paynow, poli, sofort, upi, visa)
// are not in FiatPaymentType, so they are not included here
const paymentTypeToThemeKey: Record<FiatPaymentType, keyof Theme | null> = {
  ach: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  applepay: 'paymentTypeLogoApplePay',
  colombiabank: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  credit: 'paymentTypeLogoCreditCard',
  directtobank: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  fasterpayments: 'paymentTypeLogoFasterPayments',
  googlepay: 'paymentTypeLogoGooglePay',
  iach: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  ideal: 'paymentTypeLogoIdeal',
  interac: 'paymentTypeLogoInterac',
  iobank: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  mexicobank: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  payid: 'paymentTypeLogoPayid',
  paypal: 'paymentTypeLogoPaypal',
  pix: 'paymentTypeLogoPix',
  pse: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  revolut: 'paymentTypeLogoRevolut',
  sepa: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  spei: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  turkishbank: 'paymentTypeLogoBankTransfer', // Using bank transfer as fallback
  venmo: 'paymentTypeLogoVenmo',
  wire: 'paymentTypeLogoBankTransfer' // Using bank transfer as fallback
}

/**
 * Get the theme icon for a payment type
 * @param paymentType - The payment type to get the icon for
 * @param theme - The theme object containing the icon images
 * @returns The icon image or undefined if not found
 */
export function getPaymentTypeIcon(
  paymentType: FiatPaymentType,
  theme: Theme
): ImageProp | undefined {
  const themeKey = paymentTypeToThemeKey[paymentType]
  if (themeKey == null) return undefined

  // Type assertion needed because TypeScript can't narrow the union type
  return theme[themeKey] as ImageProp
}

/**
 * Get the theme key for a payment type
 * @param paymentType - The payment type to get the theme key for
 * @returns The theme key or null if not found
 */
export function getPaymentTypeThemeKey(
  paymentType: FiatPaymentType
): keyof Theme | null {
  return paymentTypeToThemeKey[paymentType]
}
