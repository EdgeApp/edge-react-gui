/* globals describe test expect */

import * as UTILS from '../src/modules/utils.js'

describe('convertExchangeToDisplay', function () {
  test('1 BTC = $ 4,500 => 1 mBTC = $ 4.50', function () {
    const expected = 4.5

    const primaryInfo = {}
    const secondaryInfo = {}

    const convertPrimaryExchangeToPrimaryDisplay = UTILS.convertExchangeToDisplay()
    const convertSecondaryExchangeToSecondaryDisplay = UTILS.convertExchangeToDisplay()

    const primaryDisplay = convertPrimaryExchangeToPrimaryDisplay()
    const secondaryDisplay = convertSecondaryExchangeToSecondaryDisplay()

    expect(actual).toBe(expected)
  })
})
