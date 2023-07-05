import { describe, expect, it } from '@jest/globals'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { EdgeLoginScene } from '../../components/scenes/EdgeLoginScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

let account: EdgeAccount | undefined

describe('EdgeLoginScene', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <EdgeLoginScene
          {...fakeSceneProps('edgeLogin', {
            lobbyId: 'AmNsSBDVeF2837'
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
