/* globals jest describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import SettingsOverview from '../components/scenes/SettingsOverviewScene.js'
import { LOCKED_ICON, UNLOCKED_ICON } from '../constants/IconConstants.js'

describe('MyComponent', () => {
  it('should render UnLocked SettingsOverview', () => {
    const renderer = new ShallowRenderer()

    const props = {
      defaultFiat: '',
      autoLogoutTimeInMinutes: 0,
      username: '',
      account: {},
      pinLoginEnabled: false,
      supportsTouchId: false,
      touchIdEnabled: false,
      lockButton: '',
      lockButtonIcon: UNLOCKED_ICON,
      isLocked: false,
      confirmPasswordError: '',
      sendLogsStatus: '',

      setAutoLogoutTimeInMinutes: jest.fn,
      confirmPassword: jest.fn,
      lockSettings: jest.fn,
      dispatchUpdateEnableTouchIdEnable: jest.fn,
      sendLogs: jest.fn,
      resetConfirmPasswordError: jest.fn,
      resetSendLogsStatus: jest.fn,
      onTogglePinLoginEnabled: jest.fn,
      onConfirmRestoreWallets: jest.fn
    }
    const actual = renderer.render(<SettingsOverview {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render Locked SettingsOverview', () => {
    const renderer = new ShallowRenderer()

    const props = {
      defaultFiat: '',
      autoLogoutTimeInMinutes: 0,
      username: '',
      account: {},
      pinLoginEnabled: false,
      supportsTouchId: false,
      touchIdEnabled: false,
      lockButton: '',
      lockButtonIcon: LOCKED_ICON,
      isLocked: true,
      confirmPasswordError: '',
      sendLogsStatus: '',

      setAutoLogoutTimeInMinutes: jest.fn,
      confirmPassword: jest.fn,
      lockSettings: jest.fn,
      dispatchUpdateEnableTouchIdEnable: jest.fn,
      sendLogs: jest.fn,
      resetConfirmPasswordError: jest.fn,
      resetSendLogsStatus: jest.fn,
      onTogglePinLoginEnabled: jest.fn,
      onConfirmRestoreWallets: jest.fn
    }
    const actual = renderer.render(<SettingsOverview {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
