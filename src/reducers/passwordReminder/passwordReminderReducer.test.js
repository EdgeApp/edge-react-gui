/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test describe expect */

import {
  untranslatedReducer as uut,
  initialState,
  MAX_NON_PASSWORD_DAYS_LIMIT,
  MAX_NON_PASSWORD_LOGINS_LIMIT,
  NON_PASSWORD_LOGINS_POSTPONEMENT,
  NON_PASSWORD_DAYS_POSTPONEMENT
} from './indexPasswordReminder.js'
import { MILLISECONDS_PER_DAY } from '../../modules/utils.js'

describe('PasswordReminder', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = uut(undefined, {})

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
            currentDate: Date.now()
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
            currentDate: Date.now()
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
      * Update lastPasswordUse
      * reset nonPasswordLoginsCount`, () => {
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

      test('PASSWORD_USED', () => {
        const testDate = new Date()
        const needsPasswordCheck = false
        const lastPasswordUse = testDate
        const passwordUseCount = 1

        const nonPasswordDaysLimit = 2
        const nonPasswordLoginsLimit = 2

        const expected = {
          ...initialState,
          passwordUseCount,
          needsPasswordCheck,
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
          passwordUseCount: 100,
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
          passwordUseCount: 100
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
      const testDate = MILLISECONDS_PER_DAY * nonPasswordDaysLimit + 1
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
      test('Increase nonPasswordDaysLimit', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            currentDate: Date.now()
          }
        }

        const expected = initialState.nonPasswordDaysLimit + NON_PASSWORD_DAYS_POSTPONEMENT
        const actual = uut(initialState, action).nonPasswordDaysLimit

        expect(actual).toEqual(expected)
      })

      test('Increase nonPasswordLoginsLimit', () => {
        const action = {
          type: 'PASSWORD_REMINDER_POSTPONED',
          data: {
            currentDate: Date.now()
          }
        }

        const expected = initialState.nonPasswordLoginsLimit + NON_PASSWORD_LOGINS_POSTPONEMENT
        const actual = uut(initialState, action).nonPasswordLoginsLimit

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

  describe('Change Password Requested', () => {
    describe('REQUEST_CHANGE_PASSWORD', () => {
      test('Set false needsPasswordCheck', () => {
        const action = {
          type: 'REQUEST_CHANGE_PASSWORD',
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
