/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test describe expect */

import {
  passwordReminderModalReducer as uut,
  checkPasswordStart,
  checkPasswordSuccess,
  checkPasswordFail,
  initialState,
  IS_CHECKING,
  VERIFIED,
  INVALID
} from './indexPasswordReminderModal.js'

describe('PasswordReminderModal', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = uut(undefined, {})

    expect(actual).toEqual(expected)
  })

  test('CHECK_PASSWORD', () => {
    const expected = IS_CHECKING
    const actual = uut(undefined, checkPasswordStart()).status

    expect(actual).toEqual(expected)
  })

  test('VERIFIED', () => {
    const expected = VERIFIED
    const actual = uut(undefined, checkPasswordSuccess()).status

    expect(actual).toEqual(expected)
  })

  test('INVALID', () => {
    const expected = INVALID
    const actual = uut(undefined, checkPasswordFail()).status

    expect(actual).toEqual(expected)
  })
})
