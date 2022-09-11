/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletReviewComponent } from '../../components/scenes/CreateWalletReviewScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletReviewComponent', () => {
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
          },
          selectedFiat: {
            label: 'USD',
            value: 'USD'
          },
          walletName: 'my bitcoin wallet'
        }
      },

      // @ts-expect-error
      createCurrencyWallet: async (walletName, walletType, fiatCurrencyCode, cleanedPrivateKey) => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<CreateWalletReviewComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
