import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { CurrencySettingsScene } from '../../components/scenes/CurrencySettingsScene'
import { defaultAccount } from '../../reducers/CoreReducer'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

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

    const state: FakeState = {
      core: {
        account: {
          ...defaultAccount,
          currencyConfig: {
            'bitcoin-gold': {
              currencyInfo,
              watch: () => () => {}
            }
          }
        }
      }
    }

    const rendered = render(
      <FakeProviders initialState={state}>
        <CurrencySettingsScene
          {...fakeEdgeAppSceneProps('currencySettings', {
            currencyInfo
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
