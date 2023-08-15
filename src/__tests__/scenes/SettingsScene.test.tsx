import { describe, expect, it } from '@jest/globals'
import { EdgeAccount, EdgeContext } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SettingsSceneComponent } from '../../components/scenes/SettingsScene'
import { config } from '../../theme/appConfig'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

const typeHack: any = {
  currencyConfig: {},
  username: 'some user',
  logSettings: { defaultLogLevel: 'info' },
  watch() {
    return () => {}
  }
}
const account: EdgeAccount = typeHack
const context: EdgeContext = typeHack

describe('MyComponent', () => {
  it('should render UnLocked SettingsOverview', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <SettingsSceneComponent
          {...fakeSceneProps('settingsOverview', {})}
          username="some user"
          theme={config.darkTheme}
          // StateProps:
          account={account}
          context={context}
          autoLogoutTimeInSeconds={600}
          contactsPermissionOn
          defaultFiat="iso:USD"
          developerModeOn
          spamFilterOn
          isLocked={false}
          pinLoginEnabled
          supportsTouchId={false}
          touchIdEnabled
          // DispatchProps:
          dispatchUpdateEnableTouchIdEnable={async () => undefined}
          handleClearLogs={async () => {}}
          handleSendLogs={() => undefined}
          lockSettings={() => undefined}
          onTogglePinLoginEnabled={async () => undefined}
          onToggleContactsPermissionOn={async () => undefined}
          setAutoLogoutTimeInSeconds={async () => {}}
          showRestoreWalletsModal={async () => {}}
          showUnlockSettingsModal={async () => {}}
          toggleDeveloperMode={() => undefined}
          toggleSpamFilter={() => undefined}
          logoutRequest={async () => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it('should render Locked SettingsOverview', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <SettingsSceneComponent
          {...fakeSceneProps('settingsOverview', {})}
          username="some user"
          theme={config.darkTheme}
          // StateProps:
          account={account}
          context={context}
          autoLogoutTimeInSeconds={600}
          contactsPermissionOn
          defaultFiat="iso:USD"
          developerModeOn
          spamFilterOn
          isLocked
          pinLoginEnabled
          supportsTouchId={false}
          touchIdEnabled
          // DispatchProps:
          dispatchUpdateEnableTouchIdEnable={async () => undefined}
          lockSettings={() => undefined}
          handleClearLogs={async () => {}}
          handleSendLogs={() => undefined}
          onTogglePinLoginEnabled={async () => undefined}
          onToggleContactsPermissionOn={async () => undefined}
          setAutoLogoutTimeInSeconds={async () => {}}
          showRestoreWalletsModal={async () => {}}
          showUnlockSettingsModal={async () => {}}
          toggleDeveloperMode={() => undefined}
          toggleSpamFilter={() => undefined}
          logoutRequest={async () => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
