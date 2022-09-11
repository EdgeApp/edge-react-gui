/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletName } from '../../components/scenes/CreateWalletNameScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('createWalletName', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      route: {
        name: 'createWalletName',
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
          }
        }
      },
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<CreateWalletName {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
