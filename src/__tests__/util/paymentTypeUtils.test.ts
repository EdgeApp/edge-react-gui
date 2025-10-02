import {
  formatPaymentTypes,
  getPaymentTypeDisplayName
} from '../../util/paymentTypeUtils'

describe('paymentTypeUtils', () => {
  describe('getPaymentTypeDisplayName', () => {
    it('should return display name for known payment types', () => {
      expect(getPaymentTypeDisplayName('ach')).toBe('ACH Bank Transfer')
      expect(getPaymentTypeDisplayName('credit')).toBe('Credit and Debit Card')
      expect(getPaymentTypeDisplayName('venmo')).toBe('Venmo')
      expect(getPaymentTypeDisplayName('sepa')).toBe('SEPA Bank Transfer')
    })

    it('should return original value for unknown payment types', () => {
      expect(getPaymentTypeDisplayName('unknown')).toBe('unknown')
      expect(getPaymentTypeDisplayName('newpaymenttype')).toBe('newpaymenttype')
    })
  })

  describe('formatPaymentTypes', () => {
    it('should handle empty array', () => {
      expect(formatPaymentTypes([])).toBe('')
    })

    it('should format single payment type', () => {
      expect(formatPaymentTypes(['ach'])).toBe('ACH Bank Transfer')
      expect(formatPaymentTypes(['credit'])).toBe('Credit and Debit Card')
    })

    it('should format two payment types with "or"', () => {
      expect(formatPaymentTypes(['ach', 'credit'])).toBe(
        'ACH Bank Transfer or Credit and Debit Card'
      )
      expect(formatPaymentTypes(['venmo', 'paypal'])).toBe('Venmo or Paypal')
    })

    it('should format multiple payment types with commas and "or"', () => {
      expect(formatPaymentTypes(['ach', 'credit', 'venmo'])).toBe(
        'ACH Bank Transfer, Credit and Debit Card, or Venmo'
      )
      expect(formatPaymentTypes(['sepa', 'wire', 'ach', 'credit'])).toBe(
        'SEPA Bank Transfer, Bank Wire Transfer, ACH Bank Transfer, or Credit and Debit Card'
      )
    })

    it('should handle unknown payment types', () => {
      expect(formatPaymentTypes(['unknown1', 'unknown2'])).toBe(
        'unknown1 or unknown2'
      )
    })
  })
})
