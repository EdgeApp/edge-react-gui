import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SceneHeader } from '../../components/themed/SceneHeader'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('SceneHeader', () => {
  it('should render with loading props', () => {
    const fakeChild: React.ReactNode = 'hello'

    const renderer = TestRenderer.create(
      <FakeProviders>
        <SceneHeader title="string" underline withTopMargin>
          {fakeChild}
        </SceneHeader>
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
