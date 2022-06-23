// @flow
/* globals describe it expect */

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CurrencySettingsScene } from '../components/scenes/CurrencySettingsScene.js'
import { rootReducer } from '../reducers/RootReducer.js'

describe('CurrencySettings', () => {
  it('should render', () => {
    const currencyInfo: any = {
      currencyCode: 'BTG',
      defaultSettings: {},
      denominations: [
        { name: 'BTG', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTG', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' }
      ],
      pluginId: 'bitcoin-gold'
    }
    const account: any = {
      currencyConfig: {
        'bitcoin-gold': { currencyInfo }
      }
    }
    const route = {
      name: 'currencySettings',
      params: { currencyInfo }
    }
    const state: any = { core: { account } }
    const store = createStore(rootReducer, state)

    const actual = renderer.create(
      <Provider store={store}>
        <CurrencySettingsScene route={route} />
      </Provider>
    )

    expect(actual.toJSON()).toMatchSnapshot()
  })
})
