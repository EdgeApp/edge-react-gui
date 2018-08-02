/* eslint-disable flowtype/require-valid-file-annotation */

/* globals describe test expect */

import { sendConfirmation } from './reducer.js'
import { initialState } from './selectors.js'
import { newPin, reset, updateSpendPending, updatePaymentProtocolTransaction, makeSpendFailed, updateTransaction } from './action.js'

describe('sendConfirmation reducer', () => {
  test('initialState', () => {
    const actual = sendConfirmation(undefined, {})

    expect(actual).toMatchSnapshot()
  })

  test('reset', () => {
    const action = reset()
    const actual = sendConfirmation(undefined, action)

    expect(actual).toMatchSnapshot()
  })

  describe('isEditable', () => {
    test('UPDATE_PAYMENT_PROTOCOL_TRANSACTION', () => {
      const edgeTransaction = { id: '123', nativeAmount: '123' }
      const action = updatePaymentProtocolTransaction(edgeTransaction)
      const actual = sendConfirmation(initialState, action)

      expect(actual).toMatchSnapshot()
    })

    test('MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED', () => {
      const error = new Error()
      const action = makeSpendFailed(error)
      const actual = sendConfirmation(initialState, action)

      expect(actual).toMatchSnapshot()
    })
  })

  describe('error', () => {
    test('UPDATE_TRANSACTION', () => {
      const error = new Error()
      const action = updateTransaction(null, null, null, error)
      const actual = sendConfirmation(initialState, action)

      expect(actual).toMatchSnapshot()
    })

    test('MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED', () => {
      const error = new Error()
      const action = makeSpendFailed(error)
      const actual = sendConfirmation(initialState, action)

      expect(actual).toMatchSnapshot()
    })
  })

  test('pin', () => {
    const action = newPin('1234')
    const actual = sendConfirmation(initialState, action)

    expect(actual).toMatchSnapshot()
  })

  test('pin', () => {
    const action = newPin('1234')
    const actual = sendConfirmation(initialState, action)

    expect(actual).toMatchSnapshot()
  })

  test('pending', () => {
    const action = updateSpendPending(true)
    const actual = sendConfirmation(initialState, action)

    expect(actual).toMatchSnapshot()
  })
})
