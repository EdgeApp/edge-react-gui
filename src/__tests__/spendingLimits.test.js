/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import { initialState, newSpendingLimits, spendingLimits } from '../reducers/SpendingLimitsReducer.js'

describe('spendingLimits', () => {
  it('should render initialState', () => {
    const actual = spendingLimits(undefined, {})

    expect(actual).toMatchSnapshot()
  })

  describe('when logging in', () => {
    it('should update', () => {
      const loginAction = {
        type: 'ACCOUNT_INIT_COMPLETE',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 150
            }
          }
        }
      }
      const actual = spendingLimits(initialState, loginAction)

      expect(actual).toMatchSnapshot()
    })
  })

  describe('from spending limits scene', () => {
    it('should disable', () => {
      const initialState = {
        transaction: {
          isEnabled: true,
          amount: 0
        }
      }
      const updateAction = newSpendingLimits({
        transaction: {
          isEnabled: false,
          amount: 234
        }
      })
      const actual = spendingLimits(initialState, updateAction)

      expect(actual).toMatchSnapshot()
    })

    it('should enable', () => {
      const initialState = {
        transaction: {
          isEnabled: false,
          amount: 0
        }
      }
      const updateAction = newSpendingLimits({
        transaction: {
          isEnabled: true,
          amount: 234
        }
      })
      const actual = spendingLimits(initialState, updateAction)

      expect(actual).toMatchSnapshot()
    })
  })
})
