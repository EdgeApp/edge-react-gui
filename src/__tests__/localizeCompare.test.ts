import { describe, expect, it } from '@jest/globals'

import {
  bucketOf,
  checkThresholds,
  existingIsA,
  normalize,
  stableSample
} from '../../scripts/localize/compare'

describe('compare buckets', () => {
  it('sorts pairs into identical, trivial and different', () => {
    expect(bucketOf('Invia', 'Invia')).toBe('identical')
    expect(bucketOf('Invia fondi.', 'invia  fondi')).toBe('trivial')
    expect(bucketOf('“Ciao”…', '"ciao"...')).toBe('trivial')
    expect(bucketOf('Invia', 'Ricevi')).toBe('different')
  })

  it('normalizes full-width punctuation at the end', () => {
    expect(normalize('送信します。')).toBe('送信します')
  })
})

describe('stableSample', () => {
  it('returns the same keys whatever the input order', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(key => ({ key }))
    const reversed = [...items].reverse()
    expect(stableSample(items, 3)).toEqual(stableSample(reversed, 3))
    expect(stableSample(items, 3)).toHaveLength(3)
  })

  it('puts the existing value first for about half the keys', () => {
    const keys = Array.from({ length: 200 }, (_, index) => `key_${index}`)
    const first = keys.filter(existingIsA).length
    expect(first).toBeGreaterThan(70)
    expect(first).toBeLessThan(130)
  })
})

describe('checkThresholds', () => {
  it('counts the judge verdicts on pairs at or above each threshold', () => {
    const scores = new Map([
      ['a', 0.97],
      ['b', 0.92],
      ['c', 0.85],
      ['d', 0.4],
      ['e', 0.99]
    ])
    const verdicts = new Map([
      ['a', 'equivalent'],
      ['b', 'AI better'],
      ['c', 'equivalent'],
      ['d', 'existing better']
    ])
    expect(checkThresholds(scores, verdicts, [0.8, 0.9, 0.95])).toEqual([
      { threshold: 0.8, pairs: 3, verdicts: { equivalent: 2, 'AI better': 1 } },
      { threshold: 0.9, pairs: 2, verdicts: { equivalent: 1, 'AI better': 1 } },
      { threshold: 0.95, pairs: 1, verdicts: { equivalent: 1 } }
    ])
  })
})
