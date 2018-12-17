// @flow

/* globals test describe expect */

import { MAX_NON_PASSWORD_DAYS_LIMIT, MAX_NON_PASSWORD_LOGINS_LIMIT, initialState, untranslatedReducer as uut } from '../reducers/PasswordReminderReducer.js'
import { MILLISECONDS_PER_DAY, daysBetween } from '../util/utils.js'

const dummyAction: any = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('PasswordReminder', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = uut(undefined, dummyAction)

    expect(actual).toEqual(expected)
  })

  describe('Non-password login', () => {
    describe('Increment nonPasswordLoginsCount', () => {
      test('PIN_LOGIN', () => {
        const expected = initialState.nonPasswordLoginsCount + 1
        const action = {
          type: 'NON_PASSWORD_LOGIN',
          data: {
            ...initialState,
            lastLoginDate: Date.now()
          }
        }
        const actual = uut(initialState, action).nonPasswordLoginsCount

        expect(actual).toEqual(expected)
      })
    })

    describe('Load nonPasswordLoginsLimit', () => {
      test('PIN_LOGIN', () => {
        const nonPasswordLoginsLimit = 12
        const nonPasswordDaysLimit = 6
        const expected = nonPasswordLoginsLimit
        const action = {
          type: 'NON_PASSWORD_LOGIN',
          data: {
            ...initialState,
            nonPasswordDaysLimit,
            nonPasswordLoginsLimit,
            lastLoginDate: Date.now()
          }
        }
        const actual = uut(initialState, action).nonPasswordLoginsLimit

        expect(actual).toEqual(expected)
      })
    })
  })

  describe('Password used', () => {
    describe(`* Set needsPasswordCheck -> false,
      * Update nonPasswordLoginsLimit,
      * Update nonPasswordDaysLimit,
      * Update lastPasswordUseDate
      * reset nonPasswordLoginsCount`, () => {
      test('NEW_ACCOUNT_LOGIN', () => {
        const testDate = Date.now()
        const lastPasswordUseDate = testDate
        const lastLoginDate = testDate

        const expected = {
          ...initialState,
          lastPasswordUseDate,
          lastLoginDate
        }
        const action = {
          type: 'NEW_ACCOUNT_LOGIN',
          data: {
            lastLoginDate: testDate
          }
        }
        const actual = uut(initialState, action)

        expect(actual).toEqual(expected)
      })

      test('PASSWORD_USED', () => {
        const testDate = Date.now()
        const needsPasswordCheck = false
        const lastPasswordUseDate = testDate
        const passwordUseCount = 1
        const nonPasswordDaysLimit = 4
        const nonPasswordLoginsLimit = 4

        const expected = {
          ...initialState,
          passwordUseCount,
          needsPasswordCheck,
          lastPasswordUseDate,
          nonPasswordDaysLimit,
          nonPasswordLoginsLimit
        }
        const action = {
          type: 'PASSWORD_USED',
          data: {
            lastPasswordUseDate: testDate
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
          passwordUseCount: 100,
          nonPasswordLoginsLimit: MAX_NON_PASSWORD_LOGINS_LIMIT
        }
        const expected = MAX_NON_PASSWORD_LOGINS_LIMIT
        const action = {
          type: 'PASSWORD_LOGIN',
          data: {
            ...previousState,
            lastLoginDate: testDate
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
          passwordUseCount: 100
        }
        const expected = MAX_NON_PASSWORD_DAYS_LIMIT
        const action = {
          type: 'PASSWORD_LOGIN',
          data: {
            ...previousState,
            lastLoginDate: testDate
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
      const lastPasswordUseDate = 0 // 1970-01-01T00:00:00.000Z
      const testDate = MILLISECONDS_PER_DAY * nonPasswordDaysLimit + 1
      const previousState = {
        ...initialState,
        lastPasswordUseDate,
        nonPasswordDaysLimit
      }
      const expected = true
      const action = {
        type: 'NON_PASSWORD_LOGIN',
        data: {
          ...initialState,
          lastLoginDate: testDate
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
          lastLoginDate: testDate
        }
      }
      const actual = uut(previousState, action).needsPasswordCheck

      expect(actual).toEqual(expected)
    })
  })

  describe('Password Reminder skipped', () => {
    describe('PASSWORD_REMINDER_POSTPONED', () => {
      test('Increase nonPasswordDaysLimit, 2 days into future', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {}
        }

        const previousState = {
          ...initialState,
          lastLoginDate: 0
        }
        const expected = daysBetween(previousState.lastPasswordUseDate, previousState.lastLoginDate) + 2
        const actual = uut(previousState, action).nonPasswordDaysLimit

        expect(actual).toEqual(expected)
      })

      test('Set nonPasswordLoginsLimit, 2 more than current count', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            lastLoginDate: Date.now()
          }
        }

        const expected = 2
        const actual = uut(initialState, action).nonPasswordLoginsLimit

        expect(actual).toEqual(expected)
      })

      test('Set false needsPasswordCheck', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            lastLoginDate: Date.now()
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

  describe('Change Password Requested', () => {
    describe('REQUEST_CHANGE_PASSWORD', () => {
      test('Set false needsPasswordCheck', () => {
        const action = {
          type: 'REQUEST_CHANGE_PASSWORD',
          data: {
            lastLoginDate: Date.now()
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
