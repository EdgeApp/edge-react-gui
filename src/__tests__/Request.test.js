/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { Request } from '../components/scenes/RequestScene.js'

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
      useLegacyAddress: null
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with loaded props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'BTC',
      edgeWallet: {},
      exchangeSecondaryToPrimaryRatio: {},
      guiWallet: {},
      loading: false,
      primaryCurrencyInfo: {},
      receiveAddress: {},
      secondaryCurrencyInfo: {},
      showToWalletModal: false,
      useLegacyAddress: false,
      currentScene: 'request'
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
