// @flow
/* globals jest describe it expect */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { Scan } from '../components/scenes/ScanScene.js'
import { PermissionStatusStrings } from '../modules/PermissionsManager.js'

describe('Scan component', () => {
  it('should render with DENIED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      cameraPermission: PermissionStatusStrings.DENIED,
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      qrCodeScanned: jest.fn(),
      toggleEnableTorch: jest.fn(),
      toggleAddressModal: jest.fn(),
      toggleScanToWalletListModal: jest.fn(),
      addressModalDoneButtonPressed: jest.fn(),
      legacyAddressModalContinueButtonPressed: jest.fn(),
      legacyAddressModalCancelButtonPressed: jest.fn(),
      onSelectWallet: jest.fn()
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with AUTHORIZED props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      cameraPermission: PermissionStatusStrings.AUTHORIZED,
      torchEnabled: false,
      scanEnabled: false,
      showToWalletModal: false,
      qrCodeScanned: jest.fn(),
      toggleEnableTorch: jest.fn(),
      toggleAddressModal: jest.fn(),
      toggleScanToWalletListModal: jest.fn(),
      addressModalDoneButtonPressed: jest.fn(),
      legacyAddressModalContinueButtonPressed: jest.fn(),
      legacyAddressModalCancelButtonPressed: jest.fn(),
      onSelectWallet: jest.fn()
    }
    const actual = renderer.render(<Scan {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
