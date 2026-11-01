import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
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
        checkPassword: async () => true,
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
    jest.spyOn(Airship, 'show').mockResolvedValue('light' as never)

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

  describe('Change Username', () => {
    interface SceneHarness {
      navigate: unknown
      rendered: ReturnType<typeof render>
      tap: (label: string) => Promise<void>
    }

    const renderScene = (initialState: FakeState = mockState): SceneHarness => {
      const props = fakeEdgeAppSceneProps('settingsOverview', undefined)
      const navigate = jest.spyOn(props.navigation, 'navigate')
      const rendered = render(
        <FakeProviders initialState={initialState}>
          <SettingsScene {...props} />
        </FakeProviders>
      )
      // Timers are fake, so advancing them lets the press handler finish:
      const tap = async (label: string): Promise<void> => {
        fireEvent.press(rendered.getByText(label))
        await act(async () => {
          jest.advanceTimersByTime(100)
          await Promise.resolve()
        })
      }
      return { navigate, rendered, tap }
    }

    it('opens after the password prompt when locked', async () => {
      const show = jest
        .spyOn(Airship, 'show')
        .mockResolvedValue('secret' as never)
      const { navigate, rendered, tap } = renderScene()

      await tap(lstrings.settings_button_change_username)

      expect(show).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith('changeUsername', {
        password: 'secret'
      })
      rendered.unmount()
    })

    it('stays on settings when the password prompt is canceled', async () => {
      const show = jest
        .spyOn(Airship, 'show')
        .mockResolvedValue(undefined as never)
      const { navigate, rendered, tap } = renderScene()

      await tap(lstrings.settings_button_change_username)

      expect(show).toHaveBeenCalledTimes(1)
      expect(navigate).not.toHaveBeenCalled()
      rendered.getByText(lstrings.settings_button_unlock_settings)
      rendered.unmount()
    })

    it('uses the password from unlocking without prompting again', async () => {
      const show = jest
        .spyOn(Airship, 'show')
        .mockResolvedValue('secret' as never)
      const { navigate, rendered, tap } = renderScene()

      await tap(lstrings.settings_button_unlock_settings)
      rendered.getByText(lstrings.settings_button_lock_settings)
      await tap(lstrings.settings_button_change_username)

      expect(show).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith('changeUsername', {
        password: 'secret'
      })
      rendered.unmount()
    })

    describe('when the password changed after unlocking', () => {
      const staleState: FakeState = {
        ...mockState,
        core: {
          ...mockState.core,
          account: {
            ...mockState.core?.account,
            checkPassword: async (password: string) => password === 'newSecret'
          }
        }
      }

      it('prompts and renames with the newest password', async () => {
        const show = jest
          .spyOn(Airship, 'show')
          .mockResolvedValueOnce('secret' as never)
          .mockResolvedValueOnce('newSecret' as never)
        const { navigate, rendered, tap } = renderScene(staleState)

        await tap(lstrings.settings_button_unlock_settings)
        await tap(lstrings.settings_button_change_username)

        expect(show).toHaveBeenCalledTimes(2)
        expect(navigate).toHaveBeenCalledWith('changeUsername', {
          password: 'newSecret'
        })
        rendered.unmount()
      })

      it('stays on settings when the prompt is canceled', async () => {
        const show = jest
          .spyOn(Airship, 'show')
          .mockResolvedValueOnce('secret' as never)
          .mockResolvedValueOnce(undefined as never)
        const { navigate, rendered, tap } = renderScene(staleState)

        await tap(lstrings.settings_button_unlock_settings)
        await tap(lstrings.settings_button_change_username)

        expect(show).toHaveBeenCalledTimes(2)
        expect(navigate).not.toHaveBeenCalled()
        rendered.unmount()
      })
    })

    it('prompts when already unlocked without a password', async () => {
      const show = jest
        .spyOn(Airship, 'show')
        .mockResolvedValue('secret' as never)
      const { navigate, rendered, tap } = renderScene({
        ...mockState,
        ui: { settings: { ...initialSettings, changesLocked: false } }
      })

      await tap(lstrings.settings_button_change_username)

      expect(show).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith('changeUsername', {
        password: 'secret'
      })
      rendered.unmount()
    })
  })
})
