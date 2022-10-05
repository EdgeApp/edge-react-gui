import { describe, expect, test } from '@jest/globals'

import { asGetPaymentMethods, checkWyreActive } from '../plugins/gui/fiatPlugin'

const templatePaymentMethod = {
  blockchains: {},
  createdAt: 0,
  id: '',
  name: '',
  owner: '',
  status: '',
  waitingPrompts: []
}

describe('checkWyreActive', () => {
  test('Status PENDING, no methods', () => {
    const paymentMethods = asGetPaymentMethods({
      data: []
    })
    const result = checkWyreActive({ status: 'PENDING' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status PENDING, 1 method PENDING', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'PENDING' }]
    })
    const result = checkWyreActive({ status: 'PENDING' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status PENDING, 1 method ACTIVE', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'PENDING' }]
    })
    const result = checkWyreActive({ status: 'PENDING' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status APPROVED, 1 method PENDING', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'PENDING' }]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status APPROVED, no methods', () => {
    const paymentMethods = asGetPaymentMethods({
      data: []
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status APPROVED, 1 method ACTIVE', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'ACTIVE' }]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(true)
  })

  test('Status APPROVED, 2 methods ACTIVE & PENDING', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [
        { ...templatePaymentMethod, status: 'ACTIVE' },
        { ...templatePaymentMethod, status: 'PENDING' }
      ]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(true)
  })

  test('Status APPROVED, 2 methods PENDING & ACTIVE', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [
        { ...templatePaymentMethod, status: 'PENDING' },
        { ...templatePaymentMethod, status: 'ACTIVE' }
      ]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(true)
  })

  test('Status APPROVED, 1 method ACTIVE, prompt RECONNECT_BANK', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'ACTIVE', waitingPrompts: [{ type: 'RECONNECT_BANK' }] }]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(false)
  })

  test('Status APPROVED, 1 method ACTIVE, prompt blank', () => {
    const paymentMethods = asGetPaymentMethods({
      data: [{ ...templatePaymentMethod, status: 'ACTIVE', waitingPrompts: [{ type: '' }] }]
    })
    const result = checkWyreActive({ status: 'APPROVED' }, paymentMethods)
    expect(result).toBe(true)
  })
})
