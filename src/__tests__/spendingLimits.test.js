// @flow
/* globals describe it expect */

import { globalSpendingLimits, initialState } from '../reducers/GlobalSpendingLimitsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('spendingLimits', () => {
  it('should render initialState', () => {
    const actual = globalSpendingLimits(undefined, dummyAction)

    expect(actual).toMatchSnapshot()
  })

  describe('when logging in', () => {
    it('should update', () => {
      const loginAction = {
        type: 'ACCOUNT_INIT_COMPLETE',
        data: {
          globalSpendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 150
            }
          }
        }
      }
      // $FlowFixMe: The action should have many other properties
      const actual = globalSpendingLimits(initialState, loginAction)

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
      const updateAction = {
        type: 'SPENDING_LIMITS/NEW_GLOBAL_SPENDING_LIMITS',
        data: {
          globalSpendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 234
            }
          }
        }
      }
      const actual = globalSpendingLimits(initialState, updateAction)

      expect(actual).toMatchSnapshot()
    })

    it('should enable', () => {
      const initialState = {
        transaction: {
          isEnabled: false,
          amount: 0
        }
      }
      const updateAction = {
        type: 'SPENDING_LIMITS/NEW_GLOBAL_SPENDING_LIMITS',
        data: {
          globalSpendingLimits: {
            transaction: {
              isEnabled: true,
              amount: 234
            }
          }
        }
      }
      const actual = globalSpendingLimits(initialState, updateAction)

      expect(actual).toMatchSnapshot()
    })
  })
})
