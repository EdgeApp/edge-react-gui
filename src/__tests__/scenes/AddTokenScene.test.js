/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AddToken } from '../../components/scenes/AddTokenScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('AddTokenScene', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      route: {
        name: 'addToken',
        params: ['Ethereum', 'ETH', '0x123', '18']
      },
      addNewToken: (walletId, currencyName, currencyCode, contractAddress, denomination, type) => undefined,
      addTokenPending: true,
      currentCustomTokens: [
        {
          currencyName: 'Ethereum',
          currencyCode: 'ETH',
          contractAddress: '1234',
          multiplier: '1000000000',
          denomination: [{ multiplier: '100000000', name: 'BTC' }],
          isVisible: true,
          denominations: [{ multiplier: '100000000', name: 'BTC' }]
        }
      ],
      wallet: {
        id: 'myWallet',
        type: '',
        name: '',
        primaryNativeBalance: '43985',
        nativeBalances: ['ETH'],
        currencyNames: ['Ethtereum'],
        currencyCode: 'ETH',
        isoFiatCurrencyCode: {
          wallet: {
            fiatCurrencyCode: 'USD'
          },
          fiatCurrencyCode: 'USD',
          symbolImage: '₿',
          symbolImageDarkMono: '₿',
          metaTokens: {
            currencyCode: 'BTC',
            currencyName: 'Bitcoin',
            contractAddress: '123123',
            denominations: [],
            symbolImage: '₿'
          },
          enabledTokens: 'ETH',
          receiveAddress: '123123',
          addressLoadingProgress: 11,
          blockHeight: 11
        }
      },
      theme: getTheme()
    }
    const actual = renderer.render(<AddToken {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
