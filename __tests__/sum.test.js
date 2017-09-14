/* globals test expect */

// This is an example test file

// import { sum } from '../sum.js'
export const sum = (a, b) => a + b

test('adds 1 + 2 to equal 3', function () {
  expect(sum(1, 2)).toBe(3)
})
