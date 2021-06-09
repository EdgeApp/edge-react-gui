// @flow
/* globals describe it expect */

import { initialState, spendingLimits } from '../reducers/SpendingLimitsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('spendingLimits', () => {
  it('should render initialState', () => {
    const actual = spendingLimits(undefined, dummyAction)

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
      // $FlowFixMe: The action should have many other properties
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
      const updateAction = {
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 234
            }
          }
        }
      }
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
      const updateAction = {
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: true,
              amount: 234
            }
          }
        }
      }
      const actual = spendingLimits(initialState, updateAction)

      expect(actual).toMatchSnapshot()
    })
  })
})
