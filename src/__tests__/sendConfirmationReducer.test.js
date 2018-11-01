/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe test expect */

import { clone } from 'ramda'

import {
  makeSpendFailed,
  newPin,
  newSpendInfo,
  reset,
  updatePaymentProtocolTransaction,
  updateSpendPending,
  updateTransaction
} from '../actions/SendConfirmationActions.js'
import { initialState } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { sendConfirmation } from '../reducers/scenes/SendConfirmationReducer.js'

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

  describe('destination', () => {
    describe('updateTransaction', () => {
      test('with transaction and legacyAddress', () => {
        const parsedUri = {
          publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
          legacyAddress: '123412341234',
          nativeAmount: '100000',
          currencyCode: 'BCH',
          metadata: {}
        }
        const transaction = {
          blockHeight: 0,
          currencyCode: 'BCH',
          date: 0,
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: ''
        }
        const error = null
        const forceUpdateGui = true
        const initialStateClone = clone(initialState)
        const action = updateTransaction(transaction, parsedUri, forceUpdateGui, error)
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with transaction and name', () => {
        const parsedUri = {
          publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
          nativeAmount: '100000',
          currencyCode: 'BCH',
          metadata: {
            name: 'airbitz'
          }
        }
        const transaction = {
          blockHeight: 0,
          currencyCode: 'BCH',
          date: 0,
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: ''
        }
        const error = null
        const forceUpdateGui = true
        const initialStateClone = clone(initialState)
        const action = updateTransaction(transaction, parsedUri, forceUpdateGui, error)
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with error', () => {
        const transaction = null
        const parsedUri = { nativeAmount: '100000' }
        const forceUpdateGui = true
        const error = new Error()
        const initialStateClone = clone(initialState)
        const action = updateTransaction(transaction, parsedUri, forceUpdateGui, error)
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with pin error', () => {
        const parsedUri = null
        const transaction = {
          blockHeight: 0,
          currencyCode: 'BCH',
          date: 0,
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: ''
        }
        const error = new Error('Incorrect Pin')
        const forceUpdateGui = true
        const initialStateClone = clone(initialState)
        const action = updateTransaction(transaction, parsedUri, forceUpdateGui, error)
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })
    })

    describe('newSpendInfo', () => {
      test('with name', () => {
        const spendInfo = {
          currencyCode: 'BTC',
          nativeAmount: '1000',
          spendTargets: [{ currencyCode: 'BTC', nativeAmount: '1000', publicAddress: '123123123' }],
          metadata: { name: 'airbitz' }
        }
        const action = newSpendInfo(spendInfo, 'none')
        const initialStateClone = clone(initialState)
        const actual = sendConfirmation(initialStateClone, action)

        expect(actual).toMatchSnapshot()
      })

      test('without name', () => {
        const spendInfo = {
          currencyCode: 'BTC',
          nativeAmount: '1000',
          spendTargets: [{ currencyCode: 'BTC', nativeAmount: '1000', publicAddress: '123123123' }],
          metadata: {}
        }
        const action = newSpendInfo(spendInfo, 'none')
        const initialStateClone = clone(initialState)
        const actual = sendConfirmation(initialStateClone, action)

        expect(actual).toMatchSnapshot()
      })
    })
  })

  describe('address', () => {
    test('NEW_SPEND_INFO', () => {
      const spendInfo = {
        spendTargets: [{ publicAddress: '123123123', nativeAmount: '0' }],
        metadata: {}
      }
      const action = newSpendInfo(spendInfo, 'none')
      const initialStateClone = clone(initialState)

      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })
  })

  describe('isEditable', () => {
    test('UPDATE_PAYMENT_PROTOCOL_TRANSACTION', () => {
      const edgeTransaction = { id: '123', nativeAmount: '123' }
      const action = updatePaymentProtocolTransaction(edgeTransaction)
      const initialStateClone = clone(initialState)
      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })

    test('MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED', () => {
      const error = new Error()
      const action = makeSpendFailed(error)
      const initialStateClone = clone(initialState)
      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })
  })

  describe('error', () => {
    test('UPDATE_TRANSACTION', () => {
      const error = new Error()
      const action = updateTransaction(null, null, null, error)
      const initialStateClone = clone(initialState)
      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })

    test('MAKE_PAYMENT_PROTOCOL_TRANSACTION_FAILED', () => {
      const error = new Error()
      const action = makeSpendFailed(error)
      const initialStateClone = clone(initialState)
      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })
  })

  test('pin', () => {
    const action = newPin('1234')
    const initialStateClone = clone(initialState)
    const actual = sendConfirmation(initialStateClone, action)

    expect(actual).toMatchSnapshot()
  })

  test('pending', () => {
    const action = updateSpendPending(true)
    const initialStateClone = clone(initialState)
    const actual = sendConfirmation(initialStateClone, action)

    expect(actual).toMatchSnapshot()
  })
})
