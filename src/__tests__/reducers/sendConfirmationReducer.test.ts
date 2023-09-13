import { describe, expect, test } from '@jest/globals'
import { EdgeTransaction } from 'edge-core-js'
import { cloneDeep } from 'lodash'

import { lstrings } from '../../locales/strings'
import { initialState, sendConfirmation } from '../../reducers/scenes/SendConfirmationReducer'

describe('sendConfirmation reducer', () => {
  test('initialState', () => {
    const actual = sendConfirmation(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

    expect(actual).toMatchSnapshot()
  })

  test('reset', () => {
    const actual = sendConfirmation(undefined, {
      type: 'UI/SEND_CONFIRMATION/RESET'
    })

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
          isSend: true,
          memos: [],
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: '',
          walletId: ''
        }
        // use initialState after sendConfirmation reducer not longer mutates state
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        })

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
          isSend: true,
          memos: [],
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: '',
          walletId: ''
        }
        // use initialState after sendConfirmation reducer not longer mutates state
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        })

        expect(actual).toMatchSnapshot()
      })

      test('with error', () => {
        const guiMakeSpendInfo = { nativeAmount: '100000' }
        const error = new Error()
        // use initialState after sendConfirmation reducer not longer mutates state
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction: null
          }
        })

        expect(actual).toMatchSnapshot()
      })

      test('with pin error', () => {
        const guiMakeSpendInfo = { nativeAmount: '0' }
        const transaction: EdgeTransaction = {
          blockHeight: 0,
          currencyCode: 'BCH',
          date: 0,
          isSend: true,
          memos: [],
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: '',
          walletId: ''
        }
        const error = new Error(lstrings.incorrect_pin)
        // use initialState after sendConfirmation reducer not longer mutates state
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error,
            forceUpdateGui: true,
            guiMakeSpendInfo,
            transaction
          }
        })

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
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
          data: { spendInfo, authRequired: 'none' }
        })

        expect(actual).toMatchSnapshot()
      })

      test('without name', () => {
        const spendInfo = {
          currencyCode: 'BTC',
          nativeAmount: '1000',
          spendTargets: [{ currencyCode: 'BTC', nativeAmount: '1000', publicAddress: '123123123' }],
          metadata: {}
        }
        const initialStateClone: any = cloneDeep(initialState)
        const actual = sendConfirmation(initialStateClone, {
          type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
          data: { spendInfo, authRequired: 'none' }
        })

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
      const initialStateClone: any = cloneDeep(initialState)

      const actual = sendConfirmation(initialStateClone, {
        type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
        data: { spendInfo, authRequired: 'none' }
      })

      expect(actual).toMatchSnapshot()
    })
  })

  test('pin', () => {
    const initialStateClone: any = cloneDeep(initialState)

    const actual = sendConfirmation(initialStateClone, {
      type: 'UI/SEND_CONFIRMATION/NEW_PIN',
      data: { pin: '1234' }
    })

    expect(actual).toMatchSnapshot()
  })
})
