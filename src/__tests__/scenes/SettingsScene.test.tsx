import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

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
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <SettingsScene {...fakeEdgeAppSceneProps('settingsOverview', undefined)} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
