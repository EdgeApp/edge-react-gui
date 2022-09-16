import { describe, expect, it } from '@jest/globals'

import { matchJson } from '../util/matchJson'

describe('matchJson', function () {
  it('matches similar JSON structures', function () {
    expect(matchJson({ object: { a: 1, b: 'string' }, array: [false, null] }, { array: [false, null], object: { b: 'string', a: 1 } })).toEqual(true)
  })
  it('rejects unequal JSON arrays', function () {
    expect(matchJson([1, 2], [1, 2, 3])).toEqual(false)
    expect(matchJson([1, 2], [1, 3])).toEqual(false)
    expect(matchJson([1, 2], { '1': 1, '2': 2 })).toEqual(false)
    expect(matchJson({ '1': 1, '2': 2 }, [1, 2])).toEqual(false)
    expect(matchJson([1, 2], null)).toEqual(false)
  })
  it('rejects unequal JSON objects', function () {
    expect(matchJson({ a: 1, b: 2 }, { a: 1 })).toEqual(false)
    expect(matchJson({ a: 1 }, { a: 1, b: 2 })).toEqual(false)
    expect(matchJson({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(false)
    expect(matchJson({ a: 1, b: 2 }, null)).toEqual(false)
  })
})
