import { afterEach, describe, expect, jest, test } from '@jest/globals'

import {
  isKeysOnlyModeDate,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'

const DEPRECATION_MS = new Date('2026-07-09T00:00:00.000Z').getTime()

describe('isKeysOnlyModeDate', function () {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const date = new Date('2026-07-09T00:00:00.000Z')

  test('returns false before the date', function () {
    jest.spyOn(Date, 'now').mockReturnValue(DEPRECATION_MS - 1)
    expect(isKeysOnlyModeDate(date)).toBe(false)
  })

  test('returns true exactly on the date', function () {
    jest.spyOn(Date, 'now').mockReturnValue(DEPRECATION_MS)
    expect(isKeysOnlyModeDate(date)).toBe(true)
  })

  test('returns true after the date', function () {
    jest.spyOn(Date, 'now').mockReturnValue(DEPRECATION_MS + 86400000)
    expect(isKeysOnlyModeDate(date)).toBe(true)
  })
})

describe('botanix keysOnlyMode', function () {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // The flag is a getter so it re-evaluates the date on each read, rather than
  // freezing the value at module load.
  test('re-evaluates the date on each read', function () {
    const nowSpy = jest.spyOn(Date, 'now')

    nowSpy.mockReturnValue(DEPRECATION_MS - 1)
    expect(SPECIAL_CURRENCY_INFO.botanix.keysOnlyMode).toBe(false)

    nowSpy.mockReturnValue(DEPRECATION_MS)
    expect(SPECIAL_CURRENCY_INFO.botanix.keysOnlyMode).toBe(true)
  })
})
