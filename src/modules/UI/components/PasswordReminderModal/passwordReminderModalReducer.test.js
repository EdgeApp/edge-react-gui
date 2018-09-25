// @flow

/* globals test describe expect */

import { checkPasswordFail, checkPasswordStart, checkPasswordSuccess, initialState, passwordReminderModal as uut } from './indexPasswordReminderModal.js'

describe('PasswordReminderModal', () => {
  test('initialState', () => {
    const expected = initialState
    // $FlowExpectedError
    const actual = uut(undefined, {})

    expect(actual).toEqual(expected)
  })

  test('CHECK_PASSWORD', () => {
    const expected = 'IS_CHECKING'
    const actual = uut(undefined, checkPasswordStart()).status

    expect(actual).toEqual(expected)
  })

  test('VERIFIED', () => {
    const expected = 'VERIFIED'
    const actual = uut(undefined, checkPasswordSuccess()).status

    expect(actual).toEqual(expected)
  })

  test('INVALID', () => {
    const expected = 'INVALID'
    const actual = uut(undefined, checkPasswordFail()).status

    expect(actual).toEqual(expected)
  })
})
