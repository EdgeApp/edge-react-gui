import { describe, expect, test } from '@jest/globals'
import { DustSpendError, InsufficientFundsError } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import { getStakeErrorMessage } from '../util/stakeErrorUtils'

const unstakeOpts = { action: 'unstake', nativeCurrencyCode: 'ETH' } as const
const stakeOpts = { action: 'stake', nativeCurrencyCode: 'ETH' } as const

/**
 * The shape an InsufficientFundsError takes once it has crossed the yaob
 * bridge out of the edge-core-js plugin WebView: a plain Error carrying the
 * original `name` and `message`, with the prototype chain gone.
 */
const makeBridgedError = (name: string, message: string): Error => {
  const err = new Error(message)
  err.name = name
  return err
}

describe('getStakeErrorMessage', () => {
  test('explains the fee balance for a bridged unstake insufficient-funds error', () => {
    const err = makeBridgedError('InsufficientFundsError', 'Insufficient funds')
    expect(getStakeErrorMessage(err, unstakeOpts)).toBe(
      sprintf(lstrings.stake_error_insufficient_funds_unstake_s, 'ETH')
    )
  })

  test('explains the fee balance for a locally thrown insufficient-funds error', () => {
    const err = new InsufficientFundsError({ tokenId: null })
    expect(getStakeErrorMessage(err, unstakeOpts)).toBe(
      sprintf(lstrings.stake_error_insufficient_funds_unstake_s, 'ETH')
    )
  })

  test('keeps the plain insufficient-funds title for a stake', () => {
    const err = makeBridgedError('InsufficientFundsError', 'Insufficient funds')
    expect(getStakeErrorMessage(err, stakeOpts)).toBe(
      lstrings.exchange_insufficient_funds_title
    )
  })

  test('returns the message of any other Error that carries one', () => {
    expect(getStakeErrorMessage(new Error('Pool is paused'), unstakeOpts)).toBe(
      'Pool is paused'
    )
    expect(getStakeErrorMessage(new DustSpendError(), unstakeOpts)).not.toBe('')
  })

  test('falls back to the generic string for an Error with no message', () => {
    expect(getStakeErrorMessage(new Error(''), unstakeOpts)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
  })

  test('falls back to the generic string for non-Error values', () => {
    expect(getStakeErrorMessage('some string', unstakeOpts)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
    expect(getStakeErrorMessage(undefined, unstakeOpts)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
    expect(getStakeErrorMessage(null, unstakeOpts)).toBe(
      lstrings.unknown_error_occurred_fragment
    )
  })
})
