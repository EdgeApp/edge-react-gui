import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { EdgeText } from '../../components/themed/EdgeText'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('EdgeText', () => {
  it('should render with some props', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeText ellipsizeMode="tail" numberOfLines={2} style={{}} disableFontScaling={false}>
          Hello world
        </EdgeText>
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
