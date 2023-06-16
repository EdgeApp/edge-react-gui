import { describe, expect, it } from '@jest/globals'
import { EdgeAccount, EdgeContext } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SettingsSceneComponent } from '../../components/scenes/SettingsScene'
import { config } from '../../theme/appConfig'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

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
    const renderer = TestRenderer.create(
      <FakeProviders>
        <SettingsSceneComponent
          theme={config.darkTheme}
          navigation={fakeNavigation}
          // StateProps:
          account={account}
          context={context}
          autoLogoutTimeInSeconds={600}
          defaultFiat="iso:USD"
          developerModeOn
          spamFilterOn
          isLocked={false}
          pinLoginEnabled
          supportsTouchId={false}
          touchIdEnabled
          // DispatchProps:
          dispatchUpdateEnableTouchIdEnable={async () => undefined}
          handleClearLogs={() => undefined}
          handleSendLogs={() => undefined}
          lockSettings={() => undefined}
          onTogglePinLoginEnabled={async () => undefined}
          setAutoLogoutTimeInSeconds={() => undefined}
          showRestoreWalletsModal={() => undefined}
          showUnlockSettingsModal={() => undefined}
          toggleDeveloperMode={() => undefined}
          toggleSpamFilter={() => undefined}
          logoutRequest={async () => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render Locked SettingsOverview', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <SettingsSceneComponent
          theme={config.darkTheme}
          navigation={fakeNavigation}
          // StateProps:
          account={account}
          context={context}
          autoLogoutTimeInSeconds={600}
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
          handleClearLogs={() => undefined}
          handleSendLogs={() => undefined}
          onTogglePinLoginEnabled={async () => undefined}
          setAutoLogoutTimeInSeconds={() => undefined}
          showRestoreWalletsModal={() => undefined}
          showUnlockSettingsModal={() => undefined}
          toggleDeveloperMode={() => undefined}
          toggleSpamFilter={() => undefined}
          logoutRequest={async () => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
