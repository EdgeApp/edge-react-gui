import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CryptoExchangeScene } from '../../components/scenes/CryptoExchangeScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CryptoExchangeComponent', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <CryptoExchangeScene {...fakeSceneProps('exchange', {})} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
