/* globals describe test expect */

import * as SETTINGS_SELECTORS from '../src/modules/UI/Settings/selectors'

describe('getSupportedWalletTypes', function () {
  describe('when multiple supported wallet types', function () {
    test('[plugins] => [supportedWalletTypes]', function () {
      const plugins = [
        {pluginName: 'bitcoin', currencyInfo: {currencyName: 'Bitcoin', walletTypes: ['wallet:bitcoin']} },
        {pluginName: 'ethereum', currencyInfo: {currencyName: 'Ethereum', walletTypes: ['wallet:ethereum']} }
      ]
      const state = {ui: {settings: {plugins: {arrayPlugins: [
        ...plugins
      ]} } } }
      const expected = [
        {label: 'Bitcoin', value: 'wallet:bitcoin'},
        {label: 'Ethereum', value: 'wallet:ethereum'}
      ]
      const actual = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
      expect(actual).toEqual(expected)
    })
  })

  describe('when no supported wallet types', function () {
    test('[plugins] => [supportedWalletTypes]', function () {
      const plugins = []
      const state = {ui: {settings: {plugins: {arrayPlugins: [
        ...plugins
      ]} } } }
      const expected = []
      const actual = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
      expect(actual).toEqual(expected)
    })
  })
})
