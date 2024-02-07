import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePinScene } from '../../components/scenes/ChangePinScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('ChangePinComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()
    const rootState: FakeState = { ...fakeRootState, core: { account: {}, context: { appId: '' } } }

    const actual = renderer.render(
      <FakeProviders initialState={rootState}>
        <ChangePinScene {...fakeSceneProps('changePin', {})} />
      </FakeProviders>
    )

    expect(actual).toMatchSnapshot()
  })
})
