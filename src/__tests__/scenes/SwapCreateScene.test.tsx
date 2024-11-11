import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SwapCreateScene } from '../../components/scenes/SwapCreateScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSwapTabSceneProps } from '../../util/fake/fakeSceneProps'

describe('SwapCreateScene', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
