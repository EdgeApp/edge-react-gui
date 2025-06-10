import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { SettingsScene } from '../../components/scenes/SettingsScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
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

  it('should render SettingsScene', () => {
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <SettingsScene {...fakeEdgeAppSceneProps('settingsOverview', undefined)} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
