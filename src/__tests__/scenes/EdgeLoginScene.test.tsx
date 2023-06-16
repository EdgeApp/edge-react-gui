import { describe, expect, it } from '@jest/globals'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { EdgeLoginScene } from '../../components/scenes/EdgeLoginScene'
import { RouteProp } from '../../types/routerTypes'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

let account: EdgeAccount | undefined

describe('EdgeLoginScene', () => {
  const nonce = fakeNonce(0)
  it('should render with loading props', () => {
    const route: RouteProp<'edgeLogin'> = {
      key: `edgeLogin-${nonce()}`,
      name: 'edgeLogin',
      params: {
        lobbyId: 'AmNsSBDVeF2837'
      }
    }
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <EdgeLoginScene route={route} navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
