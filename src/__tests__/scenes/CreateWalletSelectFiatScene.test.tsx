/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletSelectFiatComponent } from '../../components/scenes/CreateWalletSelectFiatScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletSelectFiatComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      route: {
        name: 'createWalletReview',
        params: {
          cleanedPrivateKey: 'bitcoinbitcoinbitcoin',
          selectedWalletType: {
            currencyName: 'bitcoin',
            walletType: 'wallet:bitcoin',
            symbolImage: 'BTC',
            currencyCode: 'BTC'
          }
        }
      },
      supportedFiats: [
        {
          label: '',
          value: ''
        }
      ],
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<CreateWalletSelectFiatComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
