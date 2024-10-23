import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePasswordScene } from '../../components/scenes/ChangePasswordScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('ChangePasswordScene', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()
    const rootState: FakeState = { ...fakeRootState, core: { account: {}, context: { appId: '' } } }

    const actual = renderer.render(
      <FakeProviders initialState={rootState}>
        <ChangePasswordScene {...fakeEdgeAppSceneProps('changePassword', undefined)} />
      </FakeProviders>
    )

    expect(actual).toMatchSnapshot()
    renderer.unmount()
  })
})
