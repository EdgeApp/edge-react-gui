import { describe, expect, it } from '@jest/globals'
import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import * as TestRenderer from 'react-test-renderer'

import { ChangePinScene } from '../../components/scenes/ChangePinScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('ChangePinComponent', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState, core: { account: { changePin: async () => {} }, context: { appId: '' } } }

    const actual = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <ChangePinScene {...fakeSceneProps('changePin', {})} />
      </FakeProviders>
      // <ChangePinScreen />
    )

    expect(actual).toMatchSnapshot()
  })
})
