// @flow
/* globals describe it expect */

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import renderer from 'react-test-renderer'

import SettingsSceneComponent from '../components/scenes/SettingsOverviewScene.js'
import { edgeDark } from '../theme/variables/edgeDark.js'

const typeHack: any = {
  currencyConfig: {},
  username: 'some user'
}
const account: EdgeAccount = typeHack
const nop: any = () => undefined

describe('MyComponent', () => {
  it('should render UnLocked SettingsOverview', () => {
    const element = (
      <SettingsSceneComponent
        theme={edgeDark}
        // StateProps:
        account={account}
        autoLogoutTimeInSeconds={600}
        confirmPasswordError=""
        defaultFiat="iso:USD"
        developerModeOn
        isLocked={false}
        lockButton="settings_button_lock_settings"
        lockButtonIcon="ios-unlock"
        otpResetDate=""
        pinLoginEnabled
        supportsTouchId
        touchIdEnabled
        username={account.username}
        // DispatchProps:
        confirmPassword={nop}
        dispatchUpdateEnableTouchIdEnable={nop}
        lockSettings={nop}
        onTogglePinLoginEnabled={nop}
        resetConfirmPasswordError={nop}
        setAutoLogoutTimeInSeconds={nop}
        showReEnableOtpModal={nop}
        showRestoreWalletsModal={nop}
        showSendLogsModal={nop}
        showUnlockSettingsModal={nop}
        toggleDeveloperMode={nop}
      />
    )

    expect(renderer.create(element).toJSON()).toMatchSnapshot()
  })

  it('should render Locked SettingsOverview', () => {
    const element = (
      <SettingsSceneComponent
        theme={edgeDark}
        // StateProps:
        account={account}
        autoLogoutTimeInSeconds={600}
        confirmPasswordError=""
        defaultFiat="iso:USD"
        developerModeOn
        isLocked
        lockButton="settings_button_unlock_settings"
        lockButtonIcon="ios-lock"
        otpResetDate=""
        pinLoginEnabled
        supportsTouchId
        touchIdEnabled
        username={account.username}
        // DispatchProps:
        confirmPassword={nop}
        dispatchUpdateEnableTouchIdEnable={nop}
        lockSettings={nop}
        onTogglePinLoginEnabled={nop}
        resetConfirmPasswordError={nop}
        setAutoLogoutTimeInSeconds={nop}
        showReEnableOtpModal={nop}
        showRestoreWalletsModal={nop}
        showSendLogsModal={nop}
        showUnlockSettingsModal={nop}
        toggleDeveloperMode={nop}
      />
    )

    expect(renderer.create(element).toJSON()).toMatchSnapshot()
  })
})
