import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CurrencyNotificationScene } from '../../components/scenes/CurrencyNotificationScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CurrencyNotificationComponent', () => {
  const mockStore: FakeState = {
    notificationSettings: {
      plugins: {
        bitcoin: {
          eventId: '123id',
          currencyPair: 'BTC_iso:USD',
          dailyChange: 10,
          hourlyChange: 3
        }
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockStore}>
        <CurrencyNotificationScene
          {...fakeSceneProps('currencyNotificationSettings', {
            currencyInfo: {
              pluginId: 'bitcoin',
              displayName: 'Bitcoin',
              walletType: 'My Bitcoin Wallet',
              currencyCode: 'BTC',
              denominations: [
                {
                  multiplier: '10000000',
                  name: 'Sats'
                }
              ],
              addressExplorer: 'Blockchair',
              transactionExplorer: 'Blockchair',
              defaultSettings: ['JsonSettings'],
              metaTokens: [
                {
                  currencyCode: 'BTC',
                  currencyName: 'Bitcoin',
                  denominations: [
                    {
                      multiplier: '10000000',
                      name: 'Sats'
                    }
                  ]
                }
              ]
            }
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
