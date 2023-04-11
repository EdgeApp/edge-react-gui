import { describe, expect, it } from '@jest/globals'

import buyPluginJsonRaw from '../constants/plugins/buyPluginList.json'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import sellPluginJsonRaw from '../constants/plugins/sellPluginList.json'
import { asGuiPluginJson, GuiPlugin, GuiPluginRow } from '../types/GuiPluginTypes'
import { filterGuiPluginJson, makePluginUri } from '../util/GuiPluginTools'

const buyPluginJson = asGuiPluginJson(buyPluginJsonRaw)
const sellPluginJson = asGuiPluginJson(sellPluginJsonRaw)

describe('Production plugin data', () => {
  it('Buy & sell plugins have real pluginId fields', () => {
    for (const row of [...buyPluginJson, ...sellPluginJson]) {
      if (typeof row === 'string') continue
      const { pluginId } = row
      if (pluginId != null) expect(guiPlugins[pluginId]).not.toBeUndefined()
    }
  })

  it('Buy plugins match snapshot on iOS + US', () => {
    expect(filterGuiPluginJson(buyPluginJson, 'ios', 'US', {})).toMatchSnapshot()
  })

  it('Sell plugins match snapshot on iOS + US', () => {
    expect(filterGuiPluginJson(sellPluginJson, 'ios', 'US', {})).toMatchSnapshot()
  })

  it('Buy plugins match snapshot on android + IL', () => {
    expect(filterGuiPluginJson(buyPluginJson, 'android', 'IL', {})).toMatchSnapshot()
  })
})

describe('GuiPlugins tools', () => {
  it('filter android + US as expected', () => {
    const list = filterGuiPluginJson(testJson, 'android', 'US', {})

    expect(titles(list)).toEqual(['Credit card', 'Wire transfer'])
    expect(pluginIds(list)).toEqual(['phony', 'gox'])
    expect(list).toMatchSnapshot()
  })

  it('filter ios + US as expected', () => {
    const list = filterGuiPluginJson(testJson, 'ios', 'US', {})

    expect(titles(list)).toEqual(['Apple Pay', 'Wire transfer', 'Credit card'])
    expect(pluginIds(list)).toEqual(['phony', 'gox', 'phony'])
    expect(list).toMatchSnapshot()
  })

  it('filter ios + US - gox as expected', () => {
    const list = filterGuiPluginJson(testJson, 'ios', 'US', { gox: true })

    expect(titles(list)).toEqual(['Apple Pay', 'Credit card'])
    expect(pluginIds(list)).toEqual(['phony', 'phony'])
    expect(list).toMatchSnapshot()
  })

  it('filter ios + JP as expected', () => {
    const list = filterGuiPluginJson(testJson, 'ios', 'JP', {})

    expect(titles(list)).toEqual(['Nice lawsuit'])
    expect(pluginIds(list)).toEqual(['gox'])
    expect(list).toMatchSnapshot()
  })

  it('filter everything for GB', () => {
    const list = filterGuiPluginJson(testJson, 'ios', 'GB', {})

    expect(titles(list)).toEqual([])
  })

  it("produce correct URI's", () => {
    const testPlugin: GuiPlugin = {
      pluginId: 'local',
      storeId: 'custom',
      baseUri: 'file://test/',
      baseQuery: { api_key: 'edge' },
      displayName: 'Test Plugin'
    }
    const opts = {
      deepPath: 'sell',
      deepQuery: { kickback: null },
      promoCode: 'deals'
    }

    expect(makePluginUri(testPlugin, opts)).toEqual('file://test/sell?api_key=edge&kickback')
    expect(makePluginUri({ ...testPlugin, lockUriPath: true }, opts)).toEqual('file://test/?api_key=edge&kickback')
    expect(makePluginUri({ ...testPlugin, queryPromoCode: 'cheat' }, opts)).toEqual('file://test/sell?api_key=edge&kickback&cheat=deals')
  })
})

function pluginIds(plugins: GuiPluginRow[]): string[] {
  return plugins.map(plugin => plugin.pluginId)
}

function titles(plugins: GuiPluginRow[]): string[] {
  return plugins.map(plugin => plugin.title)
}

// This test data is designed to exercise specific problem areas:
const testJson = asGuiPluginJson([
  {
    id: 'phony-credit',
    pluginId: 'phony',
    title: 'Credit card',
    paymentTypes: ['credit'],
    forCountries: ['US', 'AU']
  },
  {
    id: 'phony-apple',
    pluginId: 'phony', // Duplicated plugin
    deepPath: '/applePay', // Different URL
    title: 'Apple Pay',
    paymentTypes: ['applepay'],
    forCountries: ['US'],
    forPlatform: 'ios'
  },
  {
    id: 'gox',
    pluginId: 'gox',
    title: 'Wire transfer',
    paymentTypes: ['wire', 'hack'],
    forCountries: ['US', 'JP']
  },
  '----- Sorting -----',
  {
    id: 'phony-credit',
    sortIndex: 3
  },
  {
    id: 'gox',
    sortIndex: 4
  },
  '----- Platform Specifics -----',
  {
    id: 'phony-apple',
    forPlatform: 'ios',
    sortIndex: 2 // Apple Pay to top on iOS
  },
  {
    id: 'phony-credit',
    forPlatform: 'ios',
    sortIndex: 5 // Credit to bottom on iOS
  },
  '----- Country Specifics -----',
  {
    id: 'gox',
    title: 'Nice lawsuit', // Special title in Japan
    forCountries: ['JP', 'GB'], // Note that GB isn't supported above
    sortIndex: 1
  }
])
