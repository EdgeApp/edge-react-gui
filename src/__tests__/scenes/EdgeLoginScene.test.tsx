import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { EdgeLoginScene } from '../../components/scenes/EdgeLoginScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

let account: EdgeAccount | undefined

describe('EdgeLoginScene', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <EdgeLoginScene
          {...fakeEdgeAppSceneProps('edgeLogin', {
            lobbyId: 'AmNsSBDVeF2837'
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
