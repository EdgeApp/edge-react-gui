/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { RequestComponent as Request } from '../components/scenes/RequestScene.js'
import { getTheme } from '../components/services/ThemeContext.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: null,
      currentScene: 'request',
      edgeWallet: null,
      exchangeSecondaryToPrimaryRatio: null,
      guiWallet: null,
      loading: true,
      primaryCurrencyInfo: null,
      receiveAddress: null,
      secondaryCurrencyInfo: null,
      showToWalletModal: null,
      useLegacyAddress: null,
      wallets: {},
      theme: getTheme()
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with loaded props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'BTC',
      edgeWallet: { currencyInfo: { pluginId: 'bitcoin' }, balances: { BTC: '1234' } },
      exchangeSecondaryToPrimaryRatio: {},
      guiWallet: {},
      loading: false,
      primaryCurrencyInfo: { displayDenomination: { multiplier: '100000000' }, exchangeDenomination: { multiplier: '100000000' } },
      receiveAddress: {},
      secondaryCurrencyInfo: {},
      showToWalletModal: false,
      useLegacyAddress: false,
      currentScene: 'request',
      wallets: {},
      theme: getTheme()
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
