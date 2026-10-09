import { describe, expect, it } from '@jest/globals'

import {
  asBodyNumber,
  asMinSeconds,
  asPositiveBiggystring,
  asQueryBoolean,
  asQueryDate,
  asQueryInteger,
  asQueryNonNegativeInteger,
  asRequestTokenId
} from '../../cli/engine/schemas'

/**
 * The layer between free-form HTTP input and every handler.
 *
 * Each of these cleaners stands on a route's `query` or `body`, and each was
 * written for a shape a real caller sends — a query string has only text, a
 * JSON body may have either. What exercised them until now was whatever flag
 * the offline suite happened to pass, which reached four of the eight
 * success arms: `asQueryDate` had never parsed a date of either accepted
 * form, although `startDate`/`endDate` on `get-transactions` and `date` on
 * three `rates-*` routes publish both. A fault there is silent at the HTTP
 * layer — a date range that parses to the wrong instant answers 200 with the
 * wrong rows.
 */
describe('asQueryBoolean', () => {
  it('reads both spellings, and a real boolean', () => {
    expect(asQueryBoolean('true')).toBe(true)
    expect(asQueryBoolean('false')).toBe(false)
    // A JSON body sends the type itself; the same cleaner serves both.
    expect(asQueryBoolean(true)).toBe(true)
    expect(asQueryBoolean(false)).toBe(false)
  })

  it('refuses anything else', () => {
    for (const raw of ['1', '0', 'yes', '', 'TRUE', 1, null]) {
      expect(() => asQueryBoolean(raw)).toThrow('Expected "true" or "false"')
    }
  })
})

describe('asQueryInteger', () => {
  it('reads a number in either form', () => {
    expect(asQueryInteger('5')).toBe(5)
    expect(asQueryInteger(5)).toBe(5)
    expect(asQueryInteger('-5')).toBe(-5)
  })

  it('refuses what is not a whole number', () => {
    for (const raw of ['abc', '', '1.5', 1.5, null, true]) {
      expect(() => asQueryInteger(raw)).toThrow('Expected a whole number')
    }
  })
})

describe('asQueryNonNegativeInteger', () => {
  it('reads zero and up', () => {
    expect(asQueryNonNegativeInteger('0')).toBe(0)
    expect(asQueryNonNegativeInteger(99)).toBe(99)
  })

  it('refuses a negative index', () => {
    // `?limit=-5` reached `slice(0, -5)`, so the engine answered every
    // transaction but the last five while `total` reported the full count.
    expect(() => asQueryNonNegativeInteger('-5')).toThrow(
      'Expected zero or a whole positive number'
    )
  })
})

describe('asQueryDate', () => {
  it('reads ISO-8601 and epoch milliseconds as the same instant', () => {
    const iso = asQueryDate('2023-11-14T22:13:20.000Z')
    const epoch = asQueryDate('1700000000000')
    expect(iso.toISOString()).toBe('2023-11-14T22:13:20.000Z')
    expect(epoch.getTime()).toBe(1700000000000)
    expect(epoch.toISOString()).toBe(iso.toISOString())
  })

  it('passes a Date through', () => {
    const date = new Date('2020-01-01T00:00:00.000Z')
    expect(asQueryDate(date)).toBe(date)
  })

  it('reads the ISO forms that are all digits', () => {
    // `Number(raw)` ran first, so any all-digit string was epoch
    // milliseconds — and ISO-8601 admits all-digit forms. `--date=2024`
    // became `1970-01-01T00:00:02.024Z` where `new Date('2024')` is
    // `2024-01-01`, and `--start-date=20240101` became
    // `1970-01-01T05:37:20.101Z`: a silently empty or wrong export window,
    // or a 1970 price in a file someone files taxes from, with no
    // `BAD_REQUEST` anywhere.
    expect(asQueryDate('2024').toISOString()).toBe('2024-01-01T00:00:00.000Z')
    expect(asQueryDate('20240131').toISOString()).toBe(
      '2024-01-31T00:00:00.000Z'
    )
    // `Date` takes neither as written: `new Date('20240131')` is `Invalid
    // Date`, so this is parsed rather than delegated.
    expect(Number.isNaN(new Date('20240131').getTime())).toBe(true)
  })

  it('refuses an all-digit value too short to be milliseconds', () => {
    // The two readings differ by fifty years, so guessing either way is the
    // silent wrongness this cleaner exists to stop. `202401` is the loudest
    // case: `new Date('202401')` is the year *202401*.
    for (const raw of ['0', '1', '202401', '123456789', '-99']) {
      expect(() => asQueryDate(raw)).toThrow('at least 12 digits')
    }
    expect(new Date('202401').getUTCFullYear()).toBe(202401)
  })

  it('refuses ten and eleven digits, which are epoch seconds', () => {
    // `1706659200` is 2024-01-31 in seconds. Read as milliseconds it was
    // `1970-01-20`, accepted with no `BAD_REQUEST` — the wrong-window case
    // the twelve-digit floor exists for.
    for (const raw of ['1706659200', '17066592000']) {
      expect(() => asQueryDate(raw)).toThrow('looks like epoch seconds')
    }
  })

  it('reads twelve digits and more as milliseconds', () => {
    // March 1973 onwards, which is every timestamp an account can have.
    expect(asQueryDate('100000000000').getTime()).toBe(100000000000)
    expect(asQueryDate('1706659200000').toISOString()).toBe(
      '2024-01-31T00:00:00.000Z'
    )
  })

  it('refuses what is not a date', () => {
    for (const raw of ['not-a-date', '', '   ', null, {}]) {
      expect(() => asQueryDate(raw)).toThrow('Expected an ISO-8601 date')
    }
  })
})

describe('asRequestTokenId', () => {
  it('reads the native asset as null, however it was spelled', () => {
    // A query string can only spell `null` as the text, and the CLI sends
    // every tokenId as a string — body or query alike.
    expect(asRequestTokenId(null)).toBeNull()
    expect(asRequestTokenId('null')).toBeNull()
  })

  it('passes a token id through', () => {
    expect(asRequestTokenId('abc123')).toBe('abc123')
  })

  it('refuses a non-string', () => {
    for (const raw of [1, true, {}, undefined]) {
      expect(() => asRequestTokenId(raw)).toThrow('Expected a token id or null')
    }
  })
})

describe('asBodyNumber', () => {
  it('reads a number sent as text or as a number', () => {
    expect(asBodyNumber(1.5)).toBe(1.5)
    expect(asBodyNumber('1.5')).toBe(1.5)
  })

  it('refuses what is not finite', () => {
    for (const raw of ['abc', '', Infinity, NaN, null]) {
      expect(() => asBodyNumber(raw)).toThrow('Expected a number')
    }
  })
})

describe('asPositiveBiggystring', () => {
  it('reads an amount bigger than a double can hold', () => {
    expect(asPositiveBiggystring('123456789012345678901234567890')).toBe(
      '123456789012345678901234567890'
    )
  })

  it('refuses a negative amount, and zero', () => {
    // Zero too: the fields this stands on are spend amounts, where zero is
    // not a send.
    expect(() => asPositiveBiggystring('-1')).toThrow(
      '"-1" is not a positive number'
    )
    expect(() => asPositiveBiggystring('0')).toThrow(
      '"0" is not a positive number'
    )
    expect(() => asPositiveBiggystring('0.00')).toThrow(
      'is not a positive number'
    )
  })
})

describe('asMinSeconds', () => {
  it('reads a value at or above the floor', () => {
    expect(asMinSeconds(30)('30')).toBe(30)
    expect(asMinSeconds(30)(60)).toBe(60)
  })

  it('refuses one below it, naming the floor', () => {
    expect(() => asMinSeconds(30)('29')).toThrow('Expected at least 30 seconds')
  })
})
