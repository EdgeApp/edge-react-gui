import { getPaymentTypeIcon, getPaymentTypeThemeKey } from '../paymentTypeIcons'

describe('paymentTypeIcons', () => {
  const mockTheme = {
    paymentTypeLogoApplePay: { uri: 'apple-pay-icon.png' },
    paymentTypeLogoBankTransfer: { uri: 'bank-transfer-icon.png' },
    paymentTypeLogoCreditCard: { uri: 'credit-card-icon.png' },
    paymentTypeLogoFasterPayments: { uri: 'faster-payments-icon.png' },
    paymentTypeLogoGooglePay: { uri: 'google-pay-icon.png' },
    paymentTypeLogoIdeal: { uri: 'ideal-icon.png' },
    paymentTypeLogoInterac: { uri: 'interac-icon.png' },
    paymentTypeLogoPayid: { uri: 'payid-icon.png' },
    paymentTypeLogoPaypal: { uri: 'paypal-icon.png' },
    paymentTypeLogoPix: { uri: 'pix-icon.png' },
    paymentTypeLogoRevolut: { uri: 'revolut-icon.png' },
    paymentTypeLogoVenmo: { uri: 'venmo-icon.png' }
  } as any

  describe('getPaymentTypeThemeKey', () => {
    it('should return correct theme key for known payment types', () => {
      expect(getPaymentTypeThemeKey('applepay')).toBe('paymentTypeLogoApplePay')
      expect(getPaymentTypeThemeKey('credit')).toBe('paymentTypeLogoCreditCard')
      expect(getPaymentTypeThemeKey('paypal')).toBe('paymentTypeLogoPaypal')
    })

    it('should return bank transfer key for fallback payment types', () => {
      expect(getPaymentTypeThemeKey('ach')).toBe('paymentTypeLogoBankTransfer')
      expect(getPaymentTypeThemeKey('sepa')).toBe('paymentTypeLogoBankTransfer')
      expect(getPaymentTypeThemeKey('wire')).toBe('paymentTypeLogoBankTransfer')
    })
  })

  describe('getPaymentTypeIcon', () => {
    it('should return correct icon for known payment types', () => {
      expect(getPaymentTypeIcon('applepay', mockTheme)).toEqual({
        uri: 'apple-pay-icon.png'
      })
      expect(getPaymentTypeIcon('credit', mockTheme)).toEqual({
        uri: 'credit-card-icon.png'
      })
    })

    it('should return bank transfer icon for fallback payment types', () => {
      expect(getPaymentTypeIcon('ach', mockTheme)).toEqual({
        uri: 'bank-transfer-icon.png'
      })
      expect(getPaymentTypeIcon('sepa', mockTheme)).toEqual({
        uri: 'bank-transfer-icon.png'
      })
    })

    it('should return undefined for invalid theme key', () => {
      const invalidTheme = {} as any
      expect(getPaymentTypeIcon('applepay', invalidTheme)).toBeUndefined()
    })
  })
})
