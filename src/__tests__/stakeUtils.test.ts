import { describe, expect, test } from '@jest/globals'

import type { PositionAllocation } from '../plugins/stake-plugins/types'
import { getAllocationCountdownMessage } from '../util/stakeUtils'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const now = new Date('2026-10-25T12:00:00.000Z')

const makeAllocation = (locktime?: Date): PositionAllocation => ({
  pluginId: 'tron',
  tokenId: null,
  currencyCode: 'TRX',
  allocationType: 'earned',
  nativeAmount: '1000000',
  locktime
})

const countdownIn = (ms: number): string | undefined =>
  getAllocationCountdownMessage(
    makeAllocation(new Date(now.valueOf() + ms)),
    now
  )

describe('getAllocationCountdownMessage', () => {
  test('no locktime', () => {
    expect(getAllocationCountdownMessage(makeAllocation(), now)).toBe(undefined)
  })

  test('locktime already passed', () => {
    expect(countdownIn(-MINUTE)).toBe(undefined)
    expect(countdownIn(0)).toBe(undefined)
  })

  test('days and hours', () => {
    expect(countdownIn(13 * DAY + 4 * HOUR + 30 * MINUTE)).toBe(
      '13 days, 4 hours remaining'
    )
    expect(countdownIn(DAY + HOUR)).toBe('1 day, 1 hour remaining')
  })

  test('whole days drop the hours', () => {
    expect(countdownIn(14 * DAY)).toBe('14 days remaining')
    expect(countdownIn(DAY + 59 * MINUTE)).toBe('1 day remaining')
  })

  test('hours and minutes under a day', () => {
    expect(countdownIn(23 * HOUR + 59 * MINUTE)).toBe(
      '23 hours, 59 minutes remaining'
    )
    expect(countdownIn(HOUR + MINUTE)).toBe('1 hour, 1 minute remaining')
    expect(countdownIn(2 * HOUR)).toBe('2 hours remaining')
  })

  test('minutes under an hour', () => {
    expect(countdownIn(59 * MINUTE + 59 * 1000)).toBe('59 minutes remaining')
    expect(countdownIn(MINUTE)).toBe('1 minute remaining')
  })

  test('less than a minute', () => {
    expect(countdownIn(59 * 1000)).toBe('Less than a minute remaining')
    expect(countdownIn(1)).toBe('Less than a minute remaining')
  })
})
