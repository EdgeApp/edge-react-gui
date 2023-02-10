import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CurrencyNotificationScene } from '../../components/scenes/CurrencyNotificationScene'
import { rootReducer } from '../../reducers/RootReducer'
import { fakeNonce } from '../../util/fake/fakeNonce'

describe('CurrencyNotificationComponent', () => {
  const nonce = fakeNonce(0)
  const mockStore: any = {
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

  const store = createStore(rootReducer, mockStore)

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CurrencyNotificationScene
          route={{
            key: `currencyNotificationSettings-${nonce()}`,
            name: 'currencyNotificationSettings',
            params: {
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
            }
          }}
        />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
