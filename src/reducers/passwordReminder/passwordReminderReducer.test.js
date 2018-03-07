/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test describe expect */

import {
  untranslatedReducer as uut,
  initialState,
  MAX_NON_PASSWORD_DAYS_LIMIT,
  MAX_NON_PASSWORD_LOGINS_LIMIT,
  NON_PASSWORD_DAYS_GROWTH_RATE,
  NON_PASSWORD_LOGINS_GROWTH_RATE
} from './indexPasswordReminder.js'
import { MILLISECONDS_PER_DAY } from '../../modules/utils.js'

describe('PasswordReminder', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = uut(undefined, {})

    expect(actual).toEqual(expected)
  })

  describe('Non-password login', () => {
    describe('Decrement nonPasswordLoginsRemaining', () => {
      test('PIN_LOGIN', () => {
        const expected = initialState.nonPasswordLoginsRemaining - 1
        const action = {
          type: 'NON_PASSWORD_LOGIN',
          data: {
            ...initialState,
            currentDate: Date.now()
          }
        }
        const actual = uut(initialState, action).nonPasswordLoginsRemaining

        expect(actual).toEqual(expected)
      })
    })

    describe('Decrement nonPasswordDaysRemaining', () => {
      test('PIN_LOGIN', () => {
        const days = 1
        const testDate = MILLISECONDS_PER_DAY * days
        const expected = initialState.nonPasswordDaysRemaining - days
        const action = {
          type: 'NON_PASSWORD_LOGIN',
          data: {
            ...initialState,
            currentDate: testDate
          }
        }
        const actual = uut(initialState, action).nonPasswordDaysRemaining

        expect(actual).toEqual(expected)
      })
    })
  })

  describe('Password used', () => {
    describe(`* Set needsPasswordCheck -> false,
      * Update nonPasswordLoginsLimit,
      * Update nonPasswordDaysLimit,
      * Set nonPasswordDaysRemaining -> nonPasswordLoginsLimit,
      * Set nonPasswordLoginsRemaining -> nonPasswordDaysLimit,
      * Update lastPasswordUse`, () => {
      test('NEW_ACCOUNT_LOGIN', () => {
        const testDate = Date.now()
        const lastPasswordUse = testDate

        const expected = {
          ...initialState,
          lastPasswordUse
        }
        const action = {
          type: 'NEW_ACCOUNT_LOGIN',
          data: {
            currentDate: testDate
          }
        }
        const actual = uut(initialState, action)

        expect(actual).toEqual(expected)
      })

      test('PASSWORD_LOGIN', () => {
        const testDate = MILLISECONDS_PER_DAY * 1
        const needsPasswordCheck = false
        const lastPasswordUse = testDate

        const nonPasswordDaysLimit = initialState.nonPasswordDaysLimit * NON_PASSWORD_DAYS_GROWTH_RATE
        const nonPasswordLoginsLimit = initialState.nonPasswordLoginsLimit * NON_PASSWORD_LOGINS_GROWTH_RATE

        const nonPasswordDaysRemaining = nonPasswordDaysLimit
        const nonPasswordLoginsRemaining = nonPasswordLoginsLimit

        const expected = {
          ...initialState,
          needsPasswordCheck,
          nonPasswordDaysRemaining,
          nonPasswordLoginsRemaining,
          lastPasswordUse,
          nonPasswordDaysLimit,
          nonPasswordLoginsLimit
        }
        const action = {
          type: 'PASSWORD_LOGIN',
          data: {
            ...initialState,
            currentDate: testDate
          }
        }
        const actual = uut(initialState, action)

        expect(actual).toEqual(expected)
      })

      test('PASSWORD_USED', () => {
        const testDate = new Date()
        const needsPasswordCheck = false
        const lastPasswordUse = testDate

        const nonPasswordDaysLimit = initialState.nonPasswordDaysLimit * NON_PASSWORD_DAYS_GROWTH_RATE
        const nonPasswordLoginsLimit = initialState.nonPasswordLoginsLimit * NON_PASSWORD_LOGINS_GROWTH_RATE

        const nonPasswordDaysRemaining = nonPasswordDaysLimit
        const nonPasswordLoginsRemaining = nonPasswordLoginsLimit

        const expected = {
          ...initialState,
          needsPasswordCheck,
          nonPasswordDaysRemaining,
          nonPasswordLoginsRemaining,
          lastPasswordUse,
          nonPasswordDaysLimit,
          nonPasswordLoginsLimit
        }
        const action = {
          type: 'PASSWORD_USED',
          data: {
            currentDate: testDate
          }
        }
        const actual = uut(initialState, action)

        expect(actual).toEqual(expected)
      })
    })

    describe('Respect MAX_NON_PASSWORD_LOGINS_LIMIT', () => {
      test('PASSWORD_LOGIN', () => {
        const testDate = new Date()
        const previousState = {
          ...initialState,
          nonPasswordLoginsLimit: MAX_NON_PASSWORD_LOGINS_LIMIT
        }
        const expected = MAX_NON_PASSWORD_LOGINS_LIMIT
        const action = {
          type: 'PASSWORD_LOGIN',
          data: {
            ...previousState,
            currentDate: testDate
          }
        }
        const actual = uut(previousState, action).nonPasswordLoginsLimit

        expect(actual).toEqual(expected)
      })
    })

    describe('Respect MAX_NON_PASSWORD_DAYS_LIMIT', () => {
      test('PASSWORD_LOGIN', () => {
        const testDate = Date.now()
        const previousState = {
          ...initialState,
          nonPasswordDaysLimit: MAX_NON_PASSWORD_DAYS_LIMIT
        }
        const expected = MAX_NON_PASSWORD_DAYS_LIMIT
        const action = {
          type: 'PASSWORD_LOGIN',
          data: {
            ...previousState,
            currentDate: testDate
          }
        }
        const actual = uut(previousState, action).nonPasswordDaysLimit

        expect(actual).toEqual(expected)
      })
    })
  })

  describe('Too many', () => {
    test('Days since last password use', () => {
      const nonPasswordDaysLimit = 32
      const lastPasswordUse = 0 // 1970-01-01T00:00:00.000Z
      const testDate = 86400000 * nonPasswordDaysLimit + 1
      const previousState = {
        ...initialState,
        lastPasswordUse,
        nonPasswordDaysLimit
      }
      const expected = true
      const action = {
        type: 'NON_PASSWORD_LOGIN',
        data: {
          ...initialState,
          currentDate: testDate
        }
      }
      const actual = uut(previousState, action).needsPasswordCheck

      expect(actual).toEqual(expected)
    })

    test('Non-password logins', () => {
      const testDate = new Date()
      const nonPasswordLoginsRemaining = 1
      const previousState = {
        ...initialState,
        nonPasswordLoginsRemaining
      }
      const expected = true
      const action = {
        type: 'NON_PASSWORD_LOGIN',
        data: {
          ...previousState,
          currentDate: testDate
        }
      }
      const actual = uut(previousState, action).needsPasswordCheck

      expect(actual).toEqual(expected)
    })
  })

  describe('Password Reminder skipped', () => {
    describe('PASSWORD_REMINDER_POSTPONED', () => {
      test('Set nonPasswordDaysRemaining >= 2', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            currentDate: Date.now()
          }
        }

        const expected = 2
        const actual = uut(initialState, action).nonPasswordDaysRemaining

        expect(actual).toEqual(expected)
      })

      test('Set nonPasswordLoginsRemaining >= 2', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            currentDate: Date.now()
          }
        }

        const expected = 2
        const actual = uut(initialState, action).nonPasswordLoginsRemaining

        expect(actual).toEqual(expected)
      })

      test('Set false needsPasswordCheck', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            currentDate: Date.now()
          }
        }
        const state = {
          ...initialState,
          needsPasswordCheck: true
        }
        const expected = false
        const actual = uut(state, action).needsPasswordCheck

        expect(actual).toEqual(expected)
      })
    })
  })
})
