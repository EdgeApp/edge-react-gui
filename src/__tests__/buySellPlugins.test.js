// @flow
/* globals describe test expect */
import { collapsePlugins } from '../constants/plugins/buySellPlugins'

const expectedBuyUSios = require('./buySellPluginTestFiles/buyUSios.json')
const expectedBuyATandroid = require('./buySellPluginTestFiles/buyATandroid.json')
const expectedBuyAUios = require('./buySellPluginTestFiles/buyAUios.json')
const expectedSellISandroid = require('./buySellPluginTestFiles/sellISandroid.json')
const expectedSellJPios = require('./buySellPluginTestFiles/sellJPios.json')
const expectedSellUSandroid = require('./buySellPluginTestFiles/sellUSandroid.json')
const buyPlugins = require('./buySellPluginTestFiles/testInputBuyPlugins')
const sellPlugins = require('./buySellPluginTestFiles/testInputSellPlugins')

describe('buySellPlugins collapse functions', () => {
  describe('getBuyPlugins', () => {
    ;[
      { platform: 'ios', countryCode: 'US', expectedPluginsCollapsed: expectedBuyUSios },
      { platform: 'android', countryCode: 'AT', expectedPluginsCollapsed: expectedBuyATandroid },
      { platform: 'ios', countryCode: 'AU', expectedPluginsCollapsed: expectedBuyAUios }
    ].forEach(({ platform, countryCode, expectedPluginsCollapsed }) => {
      test(`currencies JSON data are read and collapsed (${platform}) (${countryCode})`, () => {
        const actualPluginsCollapsed = collapsePlugins(buyPlugins, platform, countryCode)
        expect(actualPluginsCollapsed).toEqual(expectedPluginsCollapsed)
      })
    })
  })

  describe('getSellPlugins', () => {
    ;[
      { platform: 'android', countryCode: 'IS', expectedPluginsCollapsed: expectedSellISandroid },
      { platform: 'ios', countryCode: 'JP', expectedPluginsCollapsed: expectedSellJPios },
      { platform: 'android', countryCode: 'US', expectedPluginsCollapsed: expectedSellUSandroid }
    ].forEach(({ platform, countryCode, expectedPluginsCollapsed }) => {
      test(`currencies JSON data are read and collapsed (${platform}) (${countryCode})`, () => {
        const actualPluginsCollapsed = collapsePlugins(sellPlugins, platform, countryCode)
        expect(actualPluginsCollapsed).toEqual(expectedPluginsCollapsed)
      })
    })
  })
})
