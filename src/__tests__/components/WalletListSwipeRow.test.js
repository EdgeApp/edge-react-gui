/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListSwipeRow } from '../../components/themed/WalletListSwipeRow.js'

describe.skip('WalletListSwipeRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'BTC',
      guiWallet: {
        id: '123123',
        type: 'bitcoinWallet',
        name: 'myWallet',
        primaryNativeBalance: '123',
        nativeBalances: ['123'],
        currencyNames: ['Bitcoin'],
        currencyCode: 'BTC',
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
          enabledTokens: ['ETH'],
          receiveAddress: '123123',
          blockHeight: 11
        },
        isToken: true,
        openRowLeft: true,
        selectWallet: (walletId, currencyCode) => undefined,
        swipeRef: 'swipeRow',
        swipeRow: true,
        swipeDirection: 'left',
        leftRowOpened: true
      }
    }
    const actual = renderer.render(<WalletListSwipeRow {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
