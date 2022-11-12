import { describe, expect, it } from '@jest/globals'
import { EdgeAccount, EdgeContext } from 'edge-core-js'
import * as React from 'react'
import renderer from 'react-test-renderer'

import { SettingsSceneComponent } from '../../components/scenes/SettingsScene'
import { config } from '../../theme/appConfig'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

const typeHack: any = {
  currencyConfig: {},
  username: 'some user',
  logSettings: { defaultLogLevel: 'info' },
  watch() {}
}
const account: EdgeAccount = typeHack
const context: EdgeContext = typeHack

describe('MyComponent', () => {
  it('should render UnLocked SettingsOverview', () => {
    const element = (
      <SettingsSceneComponent
        theme={config.darkTheme}
        navigation={fakeNavigation}
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
        dispatchUpdateEnableTouchIdEnable={async () => undefined}
        handleSendLogs={() => undefined}
        lockSettings={() => undefined}
        onTogglePinLoginEnabled={async () => undefined}
        setAutoLogoutTimeInSeconds={() => undefined}
        showRestoreWalletsModal={() => undefined}
        showUnlockSettingsModal={() => undefined}
        toggleDeveloperMode={() => undefined}
        logoutRequest={async () => undefined}
      />
    )

    expect(renderer.create(element).toJSON()).toMatchSnapshot()
  })

  it('should render Locked SettingsOverview', () => {
    const element = (
      <SettingsSceneComponent
        theme={config.darkTheme}
        navigation={fakeNavigation}
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
        dispatchUpdateEnableTouchIdEnable={async () => undefined}
        lockSettings={() => undefined}
        handleSendLogs={() => undefined}
        onTogglePinLoginEnabled={async () => undefined}
        setAutoLogoutTimeInSeconds={() => undefined}
        showRestoreWalletsModal={() => undefined}
        showUnlockSettingsModal={() => undefined}
        toggleDeveloperMode={() => undefined}
        logoutRequest={async () => undefined}
      />
    )

    expect(renderer.create(element).toJSON()).toMatchSnapshot()
  })
})
