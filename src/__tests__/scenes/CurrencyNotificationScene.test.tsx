import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { CurrencyNotificationScene } from '../../components/scenes/CurrencyNotificationScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

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
    const rendered = render(
      <FakeProviders initialState={mockStore}>
        <CurrencyNotificationScene
          {...fakeEdgeAppSceneProps('currencyNotificationSettings', {
            currencyInfo: {
              pluginId: 'bitcoin',
              assetDisplayName: 'Bitcoin',
              chainDisplayName: 'Bitcoin',
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

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
