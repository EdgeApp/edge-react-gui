import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import type { SettlementRange, SettlementRangeUnit } from '../rampPluginTypes'

type Direction = 'buy' | 'sell'

const INSTANT: SettlementRange = {
  min: { value: 0, unit: 'minutes' },
  max: { value: 0, unit: 'minutes' }
}

const POINT = (value: number, unit: SettlementRangeUnit): SettlementRange => ({
  min: { value, unit },
  max: { value, unit }
})

const RANGE = (
  minValue: number,
  minUnit: SettlementRangeUnit,
  maxValue: number,
  maxUnit: SettlementRangeUnit
): SettlementRange => ({
  min: { value: minValue, unit: minUnit },
  max: { value: maxValue, unit: maxUnit }
})

export function getSettlementRange(
  paymentType: FiatPaymentType,
  direction: Direction = 'buy'
): SettlementRange {
  return direction === 'buy'
    ? getBuySettlementRange(paymentType)
    : getSellSettlementRange(paymentType)
}

export function getBuySettlementRange(
  paymentType: FiatPaymentType
): SettlementRange {
  switch (paymentType) {
    case 'ach':
      return RANGE(2, 'days', 3, 'days')
    case 'applepay':
      return RANGE(10, 'minutes', 30, 'minutes')
    case 'colombiabank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'credit':
      return RANGE(10, 'minutes', 30, 'minutes')
    case 'directtobank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'fasterpayments':
      return RANGE(1, 'hours', 24, 'hours')
    case 'googlepay':
      return RANGE(10, 'minutes', 30, 'minutes')
    case 'iach':
      return POINT(5, 'minutes')
    case 'ideal':
      return RANGE(0, 'minutes', 24, 'hours')
    case 'interac':
      return RANGE(1, 'days', 2, 'days')
    case 'iobank':
      // Not listed in GUI plugin lists; assume typical window
      return RANGE(5, 'minutes', 24, 'hours')
    case 'mexicobank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'payid':
      return INSTANT
    case 'paypal':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'pix':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'pse':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'revolut':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'sepa':
      return RANGE(1, 'days', 2, 'days')
    case 'spei':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'turkishbank':
      return RANGE(0, 'minutes', 1, 'hours')
    case 'venmo':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'wire':
      return POINT(5, 'minutes')
  }
}

export function getSellSettlementRange(
  paymentType: FiatPaymentType
): SettlementRange {
  switch (paymentType) {
    case 'ach':
      return RANGE(2, 'days', 3, 'days')
    case 'applepay':
      return RANGE(10, 'minutes', 30, 'minutes')
    case 'colombiabank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'credit':
      // Debit payouts reflect 5 min – 24 hours
      return RANGE(5, 'minutes', 24, 'hours')
    case 'directtobank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'fasterpayments':
      return RANGE(1, 'hours', 24, 'hours')
    case 'googlepay':
      return RANGE(10, 'minutes', 30, 'minutes')
    case 'iach':
      return POINT(5, 'minutes')
    case 'ideal':
      return RANGE(0, 'minutes', 24, 'hours')
    case 'interac':
      return INSTANT
    case 'iobank':
      // Not listed in GUI plugin lists; assume typical window
      return RANGE(5, 'minutes', 24, 'hours')
    case 'mexicobank':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'payid':
      return INSTANT
    case 'paypal':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'pix':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'pse':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'revolut':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'sepa':
      return RANGE(1, 'days', 2, 'days')
    case 'spei':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'turkishbank':
      return RANGE(0, 'minutes', 1, 'hours')
    case 'venmo':
      return RANGE(5, 'minutes', 24, 'hours')
    case 'wire':
      return POINT(5, 'minutes')
  }
}
