import { describe, expect, test } from '@jest/globals'
import { DustSpendError, InsufficientFundsError } from 'edge-core-js'

import { lstrings } from '../locales/strings'
import { getDisplayErrorMessage } from '../util/stakeErrorUtils'

describe('getDisplayErrorMessage', () => {
  test('returns the message of an Error that carries one', () => {
    expect(getDisplayErrorMessage(new Error('Insufficient funds'))).toBe(
      'Insufficient funds'
    )
  })

  test('fishes out the message from edge-core-js error subclasses', () => {
    expect(
      getDisplayErrorMessage(new InsufficientFundsError({ tokenId: null }))
    ).not.toBe('')
    expect(getDisplayErrorMessage(new DustSpendError())).not.toBe('')
  })

  test('falls back to the generic string for an Error with no message', () => {
    expect(getDisplayErrorMessage(new Error(''))).toBe(
      lstrings.unknown_error_occurred_fragment
    )
  })

  test('falls back to the generic string for non-Error values', () => {
    expect(getDisplayErrorMessage('some string')).toBe(
      lstrings.unknown_error_occurred_fragment
    )
    expect(getDisplayErrorMessage(undefined)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
    expect(getDisplayErrorMessage(null)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
  })
})
