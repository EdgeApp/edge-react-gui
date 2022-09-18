import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CurrencyNotificationScene } from '../../components/scenes/CurrencyNotificationScene'
import { rootReducer } from '../../reducers/RootReducer'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CurrencyNotificationComponent', () => {
  const mockStore: any = {
    priceChangeNotifications: {
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
    const props: any = {
      navigation: fakeNavigation,
      route: {
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
      },

      userId: '',
      disklet: {
        state: {
          core: {
            disklet: () => undefined
          }
        }
      }
    }

    const actual = renderer.create(
      <Provider store={store}>
        <CurrencyNotificationScene {...props} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
