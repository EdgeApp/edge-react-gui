import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { SceneHeader } from '../../components/themed/SceneHeader'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('SceneHeader', () => {
  it('should render with loading props', () => {
    const fakeChild: React.ReactNode = 'hello'

    const rendered = render(
      <FakeProviders>
        <SceneHeader title="string" underline withTopMargin>
          {fakeChild}
        </SceneHeader>
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
