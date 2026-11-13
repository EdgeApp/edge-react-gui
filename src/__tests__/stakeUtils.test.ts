import { describe, expect, test } from '@jest/globals'

import type { PositionAllocation } from '../plugins/stake-plugins/types'
import { formatStakeDuration, getSoonestUnlockMs } from '../util/stakeUtils'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const now = new Date('2026-11-12T12:00:00.000Z')

const makeAllocation = (locktime?: Date): PositionAllocation => ({
  pluginId: 'tron',
  tokenId: null,
  currencyCode: 'TRX',
  allocationType: 'earned',
  nativeAmount: '1000000',
  locktime
})

const unlockingIn = (ms: number): PositionAllocation =>
  makeAllocation(new Date(now.valueOf() + ms))

describe('getSoonestUnlockMs', () => {
  test('no allocations', () => {
    expect(getSoonestUnlockMs([], now)).toBe(undefined)
  })

  test('no future locktime', () => {
    expect(
      getSoonestUnlockMs(
        [makeAllocation(), unlockingIn(-MINUTE), unlockingIn(0)],
        now
      )
    ).toBe(undefined)
  })

  test('soonest future locktime', () => {
    expect(
      getSoonestUnlockMs(
        [unlockingIn(13 * DAY), unlockingIn(-HOUR), unlockingIn(2 * DAY)],
        now
      )
    ).toBe(2 * DAY)
  })
})

describe('formatStakeDuration', () => {
  test('days and hours', () => {
    expect(formatStakeDuration(13 * DAY + 4 * HOUR + 30 * MINUTE)).toBe(
      '13 days, 4 hours'
    )
    expect(formatStakeDuration(DAY + HOUR)).toBe('1 day, 1 hour')
  })

  test('whole days drop the hours', () => {
    expect(formatStakeDuration(14 * DAY)).toBe('14 days')
    expect(formatStakeDuration(DAY + 59 * MINUTE)).toBe('1 day')
  })

  test('hours and minutes under a day', () => {
    expect(formatStakeDuration(23 * HOUR + 59 * MINUTE)).toBe(
      '23 hours, 59 minutes'
    )
    expect(formatStakeDuration(HOUR + MINUTE)).toBe('1 hour, 1 minute')
    expect(formatStakeDuration(2 * HOUR)).toBe('2 hours')
  })

  test('minutes under an hour', () => {
    expect(formatStakeDuration(59 * MINUTE + 59 * 1000)).toBe('59 minutes')
    expect(formatStakeDuration(MINUTE)).toBe('1 minute')
  })

  test('less than a minute', () => {
    expect(formatStakeDuration(59 * 1000)).toBe('less than a minute')
    expect(formatStakeDuration(0)).toBe('less than a minute')
  })
})
