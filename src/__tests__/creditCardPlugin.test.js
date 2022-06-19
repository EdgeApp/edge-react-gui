// @flow
/* globals describe test expect */
import { sprintf } from 'sprintf-js'

import s from '../locales/strings'
import { getBestError } from '../plugins/gui/creditCardPlugin'
import { type FiatProviderQuoteError } from '../plugins/gui/fiatProviderTypes'

describe('creditCardPlugin', function () {
  describe('getBestError', function () {
    test('overLimit', function () {
      const errors: FiatProviderQuoteError[] = [{ errorType: 'overLimit', errorAmount: 50 }]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_over_limit, '50 USD'))
    })
    test('underLimit', function () {
      const errors: FiatProviderQuoteError[] = [{ errorType: 'underLimit', errorAmount: 50 }]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '50 USD'))
    })
    test('regionRestricted', function () {
      const errors: FiatProviderQuoteError[] = [{ errorType: 'regionRestricted' }]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_buy_region_restricted)
    })
    test('assetUnsupported', function () {
      const errors: FiatProviderQuoteError[] = [{ errorType: 'assetUnsupported' }]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_asset_unsupported)
    })
    test('underLimit 1 2 3', function () {
      const errors: FiatProviderQuoteError[] = [
        { errorType: 'underLimit', errorAmount: 1 },
        { errorType: 'underLimit', errorAmount: 2 },
        { errorType: 'underLimit', errorAmount: 3 }
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '1 USD'))
    })
    test('overLimit 1 2 3', function () {
      const errors: FiatProviderQuoteError[] = [
        { errorType: 'overLimit', errorAmount: 1 },
        { errorType: 'overLimit', errorAmount: 2 },
        { errorType: 'overLimit', errorAmount: 3 }
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_over_limit, '3 USD'))
    })
    test('overLimit underLimit regionRestricted assetUnsupported', function () {
      const errors: FiatProviderQuoteError[] = [
        { errorType: 'overLimit', errorAmount: 1 },
        { errorType: 'underLimit', errorAmount: 2 },
        { errorType: 'regionRestricted' },
        { errorType: 'assetUnsupported' }
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '2 USD'))
    })
    test('regionRestricted assetUnsupported', function () {
      const errors: FiatProviderQuoteError[] = [{ errorType: 'regionRestricted' }, { errorType: 'assetUnsupported' }]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_buy_region_restricted)
    })
  })
})
