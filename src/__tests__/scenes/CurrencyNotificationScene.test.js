/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CurrencyNotificationComponent } from '../../components/scenes/CurrencyNotificationScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('CurrencyNotificationComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

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

    const actual = renderer.render(<CurrencyNotificationComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
