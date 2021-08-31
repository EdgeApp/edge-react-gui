// @flow
/* globals describe it expect */

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import * as React from 'react'
import renderer from 'react-test-renderer'

import { SettingsSceneComponent } from '../components/scenes/SettingsScene.js'
import { edgeDark } from '../theme/variables/edgeDark.js'

const typeHack: any = {
  currencyConfig: {},
  username: 'some user',
  logSettings: { defaultLogLevel: 'info' },
  watch() {}
}
const account: EdgeAccount = typeHack
const context: EdgeContext = typeHack
const nop: any = () => undefined

describe('MyComponent', () => {
  it('should render UnLocked SettingsOverview', () => {
    const element = (
      <SettingsSceneComponent
        theme={edgeDark}
        // StateProps:
        account={account}
        context={context}
        autoLogoutTimeInSeconds={600}
        defaultFiat="iso:USD"
        developerModeOn
        isLocked={false}
        pinLoginEnabled
        supportsTouchId={false}
        touchIdEnabled
        // DispatchProps:
        confirmPassword={nop}
        dispatchUpdateEnableTouchIdEnable={nop}
        handleSendLogs={nop}
        lockSettings={nop}
        onTogglePinLoginEnabled={nop}
        resetConfirmPasswordError={nop}
        setAutoLogoutTimeInSeconds={nop}
        showRestoreWalletsModal={nop}
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
        context={context}
        autoLogoutTimeInSeconds={600}
        defaultFiat="iso:USD"
        developerModeOn
        isLocked
        pinLoginEnabled
        supportsTouchId={false}
        touchIdEnabled
        // DispatchProps:
        confirmPassword={nop}
        dispatchUpdateEnableTouchIdEnable={nop}
        lockSettings={nop}
        handleSendLogs={nop}
        onTogglePinLoginEnabled={nop}
        resetConfirmPasswordError={nop}
        setAutoLogoutTimeInSeconds={nop}
        showRestoreWalletsModal={nop}
        showUnlockSettingsModal={nop}
        toggleDeveloperMode={nop}
      />
    )

    expect(renderer.create(element).toJSON()).toMatchSnapshot()
  })
})
