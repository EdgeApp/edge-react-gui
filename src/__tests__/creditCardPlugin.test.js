// @flow
/* globals describe test expect */
import { sprintf } from 'sprintf-js'

import s from '../locales/strings'
import { FiatProviderError } from '../plugins/gui/fiatProviderTypes'
import { getBestError } from '../plugins/gui/pluginUtils'

describe('creditCardPlugin', function () {
  describe('getBestError', function () {
    test('overLimit', function () {
      const errors: FiatProviderError[] = [new FiatProviderError({ errorType: 'overLimit', errorAmount: 50 })]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_over_limit, '50 USD'))
    })
    test('underLimit', function () {
      const errors: FiatProviderError[] = [new FiatProviderError({ errorType: 'underLimit', errorAmount: 50 })]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '50 USD'))
    })
    test('regionRestricted', function () {
      const errors: FiatProviderError[] = [new FiatProviderError({ errorType: 'regionRestricted' })]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_buy_region_restricted)
    })
    test('assetUnsupported', function () {
      const errors: FiatProviderError[] = [new FiatProviderError({ errorType: 'assetUnsupported' })]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_asset_unsupported)
    })
    test('underLimit 1 2 3', function () {
      const errors: FiatProviderError[] = [
        new FiatProviderError({ errorType: 'underLimit', errorAmount: 1 }),
        new FiatProviderError({ errorType: 'underLimit', errorAmount: 2 }),
        new FiatProviderError({ errorType: 'underLimit', errorAmount: 3 })
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '1 USD'))
    })
    test('overLimit 1 2 3', function () {
      const errors: FiatProviderError[] = [
        new FiatProviderError({ errorType: 'overLimit', errorAmount: 1 }),
        new FiatProviderError({ errorType: 'overLimit', errorAmount: 2 }),
        new FiatProviderError({ errorType: 'overLimit', errorAmount: 3 })
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_over_limit, '3 USD'))
    })
    test('overLimit underLimit regionRestricted assetUnsupported', function () {
      const errors: FiatProviderError[] = [
        new FiatProviderError({ errorType: 'overLimit', errorAmount: 1 }),
        new FiatProviderError({ errorType: 'underLimit', errorAmount: 2 }),
        new FiatProviderError({ errorType: 'regionRestricted' }),
        new FiatProviderError({ errorType: 'assetUnsupported' })
      ]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(sprintf(s.strings.fiat_plugin_buy_amount_under_limit, '2 USD'))
    })
    test('regionRestricted assetUnsupported', function () {
      const errors: FiatProviderError[] = [new FiatProviderError({ errorType: 'regionRestricted' }), new FiatProviderError({ errorType: 'assetUnsupported' })]
      const result = getBestError(errors, 'USD')
      expect(result).toBe(s.strings.fiat_plugin_buy_region_restricted)
    })
  })
})
