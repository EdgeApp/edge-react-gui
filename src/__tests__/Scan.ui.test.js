// @flow
/* globals jest describe it expect */

import * as React from 'react'
import RNPermissions from 'react-native-permissions'
import ShallowRenderer from 'react-test-renderer/shallow'

import { Scan } from '../components/scenes/ScanScene.js'

describe('Scan component', () => {
  it('should render with BLOCKED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      route: {
        name: 'scan',
        params: {
          data: 'loginQR'
        }
      },
      cameraPermission: RNPermissions.BLOCKED,
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      currentWalletId: '',
      currentCurrencyCode: '',
      walletId: '',
      currencyCode: '',
      wallets: {},
      qrCodeScanned: jest.fn(),
      loginQrCodeScanned: jest.fn(),
      parseScannedUri: jest.fn(),
      toggleEnableTorch: jest.fn(),
      onSelectWallet: jest.fn(),
      selectFromWalletForExchange: jest.fn()
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with GRANTED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      route: {
        name: 'scan',
        params: {
          data: 'loginQR'
        }
      },
      cameraPermission: RNPermissions.GRANTED,
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      currentWalletId: '',
      currentCurrencyCode: '',
      walletId: '',
      currencyCode: '',
      wallets: {},
      qrCodeScanned: jest.fn(),
      loginQrCodeScanned: jest.fn(),
      parseScannedUri: jest.fn(),
      toggleEnableTorch: jest.fn(),
      onSelectWallet: jest.fn(),
      selectFromWalletForExchange: jest.fn()
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
