// @flow
/* globals describe it expect */

import { collapsePlugins, guiPlugins } from '../constants/plugins/GuiPlugins.js'
import { type BuySellPlugin } from '../types/GuiPluginTypes.js'

const buyPluginJson = require('../constants/plugins/buyPluginList.json')
const sellPluginJson = require('../constants/plugins/sellPluginList.json')

describe('Production plugin data', () => {
  it('Has accurate pluginId fields', () => {
    const pluginIds = Object.keys(guiPlugins)
    for (const pluginId of pluginIds) {
      expect(guiPlugins[pluginId].pluginId).toEqual(pluginId)
    }
  })

  it('Buy & sell plugins have real pluginId fields', () => {
    for (const row of [...buyPluginJson, ...sellPluginJson]) {
      if (typeof row === 'string') continue
      const { pluginId } = row
      if (pluginId != null) expect(guiPlugins[pluginId]).not.toBeUndefined()
    }
  })

  it('Buy plugins match snapshot on iOS + US', () => {
    expect(collapsePlugins(buyPluginJson, 'ios', 'US')).toMatchSnapshot()
  })

  it('Sell plugins match snapshot on iOS + US', () => {
    expect(collapsePlugins(sellPluginJson, 'ios', 'US')).toMatchSnapshot()
  })

  it('Buy plugins match snapshot on android + IL', () => {
    expect(collapsePlugins(buyPluginJson, 'android', 'IL')).toMatchSnapshot()
  })
})

describe('GuiPlugins tools', () => {
  it('filter android + US as expected', () => {
    const list = collapsePlugins(testJson, 'android', 'US')

    expect(titles(list)).toEqual(['Credit card', 'Wire transfer'])
    expect(pluginIds(list)).toEqual(['phony', 'gox'])
    expect(list).toMatchSnapshot()
  })

  it('filter ios + US as expected', () => {
    const list = collapsePlugins(testJson, 'ios', 'US')

    expect(titles(list)).toEqual(['Apple Pay', 'Wire transfer', 'Credit card'])
    expect(pluginIds(list)).toEqual(['phony', 'gox', 'phony'])
    expect(list).toMatchSnapshot()
  })

  it('filter ios + JP as expected', () => {
    const list = collapsePlugins(testJson, 'ios', 'JP')

    expect(titles(list)).toEqual(['Nice lawsuit'])
    expect(pluginIds(list)).toEqual(['gox'])
    expect(list).toMatchSnapshot()
  })

  it('filter everything for GB', () => {
    const list = collapsePlugins(testJson, 'ios', 'GB')

    expect(titles(list)).toEqual([])
  })
})

function pluginIds (plugins: BuySellPlugin[]): string[] {
  return plugins.map(plugin => plugin.pluginId)
}

function titles (plugins: BuySellPlugin[]): string[] {
  return plugins.map(plugin => plugin.title)
}

// This test data is designed to exercise specific problem areas:
const testJson: any = [
  {
    id: 'phony-credit',
    pluginId: 'phony',
    title: 'Credit card',
    paymentType: 'credit',
    countryCodes: { US: true, AU: true }
  },
  {
    id: 'phony-apple',
    pluginId: 'phony', // Duplicated plugin
    addOnUrl: '/applePay', // Different URL
    title: 'Apple Pay',
    paymentType: 'applepay',
    countryCodes: { US: true },
    forPlatform: 'ios'
  },
  {
    id: 'gox',
    pluginId: 'gox',
    title: 'Wire transfer',
    paymentType: {
      wire: true,
      hack: true
    },
    countryCodes: { US: true, JP: true }
  },
  '----- Sorting -----',
  {
    id: 'phony-credit',
    priority: 3
  },
  {
    id: 'gox',
    priority: 4
  },
  '----- Platform Specifics -----',
  {
    id: 'phony-apple',
    forPlatform: 'ios',
    priority: 2 // Apple Pay to top on iOS
  },
  {
    id: 'phony-credit',
    forPlatform: 'ios',
    priority: 5 // Credit to bottom on iOS
  },
  '----- Country Specifics -----',
  {
    id: 'gox',
    title: 'Nice lawsuit', // Special title in Japan
    forCountries: ['JP', 'GB'], // Note that GB isn't supported above
    priority: 1
  }
]
