// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletName } from '../../components/scenes/CreateWalletNameScene'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('createWalletName', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
    const actual = renderer.render(<CreateWalletName {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
