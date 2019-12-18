// @flow
/* globals describe test expect */

import { displayToSeconds, secondsToDisplay } from '../util/displayTime.js'

describe('displayToSeconds', function () {
  test('2.1 seconds', function () {
    expect(displayToSeconds({ measurement: 'seconds', value: 2.1 })).toEqual(2.1)
  })
  test('2.1 minutes', function () {
    expect(displayToSeconds({ measurement: 'minutes', value: 2.1 })).toEqual(126)
  })
  test('2.1 hours', function () {
    expect(displayToSeconds({ measurement: 'hours', value: 2.1 })).toEqual(7560)
  })
  test('2.1 days', function () {
    expect(displayToSeconds({ measurement: 'days', value: 2.1 })).toEqual(181440)
  })
})

describe('secondsToDisplay', function () {
  test('2.1 seconds', function () {
    expect(secondsToDisplay(2.1)).toEqual({ measurement: 'seconds', value: 2 })
  })
  test('2.1 minutes', function () {
    expect(secondsToDisplay(126)).toEqual({ measurement: 'minutes', value: 2 })
  })
  test('2.1 hours', function () {
    expect(secondsToDisplay(7560)).toEqual({ measurement: 'hours', value: 2 })
  })
  test('2.1 days', function () {
    expect(secondsToDisplay(181440)).toEqual({ measurement: 'days', value: 2 })
  })
})
