/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { EditTokenComponent } from '../../components/scenes/EditTokenScene'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('EditTokenComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      route: {
        params: {
          currencyCode: 'BTC',
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
          ],
          walletId: 'myWallet'
        }
      },
      customTokens: [
        {
          currencyName: 'Shiba Inu',
          currencyCode: 'SHIB',
          contractAddress: '0x73246288',
          multiplier: '10000000',
          denomination: 'ETH',
          denominations: [
            {
              multiplier: '100000000',
              name: 'ETH'
            }
          ]
        }
      ],
      editCustomTokenProcessing: true,
      deleteCustomToken: async (walletId, currencyCode) => undefined,
      editCustomToken: (walletId, currencyName, currencyCode, contractAddress, denomination, oldCurrencyCode) => undefined,
      theme: getTheme()
    }

    const actual = renderer.render(<EditTokenComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
