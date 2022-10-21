import { describe, expect, it } from '@jest/globals'

import { initialState, spendingLimits } from '../reducers/SpendingLimitsReducer'

describe('spendingLimits', () => {
  it('should render initialState', () => {
    const actual = spendingLimits(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

    expect(actual).toMatchSnapshot()
  })

  describe('when logging in', () => {
    it('should update', () => {
      const actual = spendingLimits(initialState, {
        type: 'ACCOUNT_INIT_COMPLETE',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 150
            }
          }
        } as any
      })

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
      const actual = spendingLimits(initialState, {
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: false,
              amount: 234
            }
          }
        }
      })

      expect(actual).toMatchSnapshot()
    })

    it('should enable', () => {
      const initialState = {
        transaction: {
          isEnabled: false,
          amount: 0
        }
      }
      const actual = spendingLimits(initialState, {
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: {
          spendingLimits: {
            transaction: {
              isEnabled: true,
              amount: 234
            }
          }
        }
      })

      expect(actual).toMatchSnapshot()
    })
  })
})
