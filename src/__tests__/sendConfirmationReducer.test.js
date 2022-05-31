// @flow
/* globals describe test expect */

import { type EdgeTransaction } from 'edge-core-js'
import { cloneDeep } from 'lodash'

import s from '../locales/strings.js'
import { initialState } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { sendConfirmation } from '../reducers/scenes/SendConfirmationReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('sendConfirmation reducer', () => {
  test('initialState', () => {
    const actual = sendConfirmation(undefined, dummyAction)

    expect(actual).toMatchSnapshot()
  })

  test('reset', () => {
    const action = { type: 'UI/SEND_CONFIRMATION/RESET' }
    const actual = sendConfirmation(undefined, action)

    expect(actual).toMatchSnapshot()
  })

  describe('destination', () => {
    describe('updateTransaction', () => {
      test('with transaction and legacyAddress', () => {
        const guiMakeSpendInfo = {
          publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
          legacyAddress: '123412341234',
          nativeAmount: '100000',
          currencyCode: 'BCH',
          metadata: {}
        }
        const transaction: EdgeTransaction = {
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
        const initialStateClone = cloneDeep(initialState)
        const action = {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        }
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with transaction and name', () => {
        const guiMakeSpendInfo = {
          publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
          nativeAmount: '100000',
          currencyCode: 'BCH',
          metadata: {
            name: 'airbitz'
          }
        }
        const transaction: EdgeTransaction = {
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
        const initialStateClone = cloneDeep(initialState)
        const action = {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        }
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with error', () => {
        const guiMakeSpendInfo = { nativeAmount: '100000' }
        const error = new Error()
        const initialStateClone = cloneDeep(initialState)
        const action = {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction: null
          }
        }
        const actual = sendConfirmation(initialStateClone, action) // use initialState after sendConfirmation reducer not longer mutates state

        expect(actual).toMatchSnapshot()
      })

      test('with pin error', () => {
        const guiMakeSpendInfo = { nativeAmount: '0' }
        const transaction: EdgeTransaction = {
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
        const error = new Error(s.strings.incorrect_pin)
        const initialStateClone = cloneDeep(initialState)
        const action = {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        }
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
        const action = {
          type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
          data: { spendInfo, authRequired: 'none' }
        }
        const initialStateClone = cloneDeep(initialState)
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
        const action = {
          type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
          data: { spendInfo, authRequired: 'none' }
        }
        const initialStateClone = cloneDeep(initialState)
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
      const action = {
        type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
        data: { spendInfo, authRequired: 'none' }
      }
      const initialStateClone = cloneDeep(initialState)

      const actual = sendConfirmation(initialStateClone, action)

      expect(actual).toMatchSnapshot()
    })
  })

  test('pin', () => {
    const action = {
      type: 'UI/SEND_CONFIRMATION/NEW_PIN',
      data: { pin: '1234' }
    }
    const initialStateClone = cloneDeep(initialState)
    const actual = sendConfirmation(initialStateClone, action)

    expect(actual).toMatchSnapshot()
  })
})
