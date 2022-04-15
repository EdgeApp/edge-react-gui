/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletReviewComponent } from '../../components/scenes/CreateWalletReviewScene'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('CreateWalletReviewComponent', () => {
  it('should render with loading props', () => {
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
      createCurrencyWallet: async (walletName, walletType, fiatCurrencyCode, cleanedPrivateKey) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<CreateWalletReviewComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
