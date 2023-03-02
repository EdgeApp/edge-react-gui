import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CurrencySettingsScene } from '../../components/scenes/CurrencySettingsScene'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

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

    const state: FakeState = {
      core: {
        account: {
          currencyConfig: {
            'bitcoin-gold': { currencyInfo }
          }
        }
      }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={state}>
        <CurrencySettingsScene
          route={{
            key: `currencySettings-${nonce()}`,
            name: 'currencySettings',
            params: { currencyInfo }
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
