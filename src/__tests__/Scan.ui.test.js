// @flow
/* globals jest describe it expect */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { Scan } from '../components/scenes/ScanScene.js'

describe('Scan component', () => {
  it('should render with DENIED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      cameraPermission: 'denied',
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      deepLinkPending: false,
      deepLinkUri: null,
      wallets: {},
      qrCodeScanned: jest.fn(),
      parseScannedUri: jest.fn(),
      markAddressDeepLinkDone: jest.fn(),
      toggleEnableTorch: jest.fn(),
      toggleAddressModal: jest.fn(),
      toggleScanToWalletListModal: jest.fn(),
      onSelectWallet: jest.fn()
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with AUTHORIZED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      cameraPermission: 'authorized',
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      deepLinkPending: false,
      deepLinkUri: null,
      qrCodeScanned: jest.fn(),
      parseScannedUri: jest.fn(),
      markAddressDeepLinkDone: jest.fn(),
      toggleEnableTorch: jest.fn(),
      toggleAddressModal: jest.fn(),
      toggleScanToWalletListModal: jest.fn(),
      onSelectWallet: jest.fn(),
      wallets: {}
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
