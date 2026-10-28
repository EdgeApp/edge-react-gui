import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'

import * as DeviceSettingsActions from '../../actions/DeviceSettingsActions'
import { SettingsScene } from '../../components/scenes/SettingsScene'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { initialState as initialSettings } from '../../reducers/scenes/SettingsReducer'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('SettingsScene', () => {
  const mockState: FakeState = {
    core: {
      account: {
        rootLoginId: 'XXX',
        currencyConfig: {},
        username: 'some user',
        watch: () => () => {}
      },
      context: {
        logSettings: { defaultLogLevel: 'silent' },
        watch: () => () => {}
      }
    }
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render SettingsScene', () => {
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <SettingsScene
          {...fakeEdgeAppSceneProps('settingsOverview', undefined)}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('saves the mode picked in the theme modal', async () => {
    const developerState: FakeState = {
      ...mockState,
      ui: { settings: { ...initialSettings, developerModeOn: true } }
    }
    const write = jest
      .spyOn(DeviceSettingsActions, 'writeThemeMode')
      .mockResolvedValue(undefined)
    jest.spyOn(Airship, 'show').mockResolvedValue('light')

    const rendered = render(
      <FakeProviders initialState={developerState}>
        <SettingsScene
          {...fakeEdgeAppSceneProps('settingsOverview', undefined)}
        />
      </FakeProviders>
    )
    fireEvent.press(rendered.getByText(lstrings.settings_theme))
    await waitFor(() => {
      expect(write).toHaveBeenCalledWith('light')
    })
    rendered.unmount()
  })
})
