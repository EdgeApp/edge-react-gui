import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CurrencySettingsScene } from '../../components/scenes/CurrencySettingsScene'
import { rootReducer } from '../../reducers/RootReducer'
import { fakeNonce } from '../../util/fake/fakeNonce'

describe('CurrencySettings', () => {
  const nonce = fakeNonce(0)
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

    const state: any = { core: { account } }
    const store = createStore(rootReducer, state)

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CurrencySettingsScene
          route={{
            key: `currencySettings-${nonce()}`,
            name: 'currencySettings',
            params: { currencyInfo }
          }}
        />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
