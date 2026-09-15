import { describe, expect, it } from '@jest/globals'

import type { BanxaPaymentIdLimit } from '../../../../plugins/ramps/banxa/banxaRampPlugin'
import { pickPreferredPayment } from '../../../../plugins/ramps/banxa/banxaRampPlugin'

// Banxa's live USD Google Pay methods: four legacy WorldPay PSPs that all sort
// below the consolidated PRIMERGP PSP that replaced them.
const worldpayGoogleUsd: BanxaPaymentIdLimit = {
  id: 6036,
  paymentType: 'WORLDPAYGOOGLE',
  type: 'googlepay',
  min: '20',
  max: '15000'
}
const primerGooglePay: BanxaPaymentIdLimit = {
  id: 6142,
  paymentType: 'PRIMERGP',
  type: 'googlepay',
  min: '20',
  max: '15000'
}
const primerCredit: BanxaPaymentIdLimit = {
  id: 6098,
  paymentType: 'PRIMERCC',
  type: 'credit',
  min: '20',
  max: '15000'
}

describe('pickPreferredPayment', function () {
  it('prefers the current PSP over the deprecated one it replaced', function () {
    const payments = [worldpayGoogleUsd, primerGooglePay]

    expect(pickPreferredPayment(payments, 'googlepay')).toBe(primerGooglePay)
  })

  it('ignores the order Banxa payment ids happen to iterate in', function () {
    const payments = [primerGooglePay, worldpayGoogleUsd]

    expect(pickPreferredPayment(payments, 'googlepay')).toBe(primerGooglePay)
  })

  it('falls back to the deprecated PSP when it is the only candidate', function () {
    const payments = [worldpayGoogleUsd, primerCredit]

    expect(pickPreferredPayment(payments, 'googlepay')).toBe(worldpayGoogleUsd)
  })

  it('returns undefined when no payment method matches the type', function () {
    const payments = [worldpayGoogleUsd, primerGooglePay]

    expect(pickPreferredPayment(payments, 'ach')).toBeUndefined()
  })
})
