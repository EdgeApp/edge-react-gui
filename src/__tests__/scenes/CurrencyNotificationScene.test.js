/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CurrencyNotificationScene } from '../../components/scenes/CurrencyNotificationScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { rootReducer } from '../../reducers/RootReducer.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('CurrencyNotificationComponent', () => {
  const mockStore = {
    core: {
      account: {
        rootLoginId: '332s0ds39f'
      }
    }
  }

  const store = createStore(rootReducer, mockStore)

  it('should render with loading props', () => {
    const props = {
      navigation: fakeNavigation,
      route: {
        params: {
          currencyInfo: {
            pluginId: '',
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
      },
      enableNotifications: (currencyCode, hours, enabled) => undefined,
      theme: getTheme()
    }

    const actual = renderer.create(
      <Provider store={store}>
        <CurrencyNotificationScene {...props} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
