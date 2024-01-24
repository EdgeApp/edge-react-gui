import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { EdgeText } from '../../components/themed/EdgeText'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('EdgeText', () => {
  it('should render with some props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeText ellipsizeMode="tail" numberOfLines={2} style={{}} disableFontScaling={false}>
          Hello world
        </EdgeText>
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
