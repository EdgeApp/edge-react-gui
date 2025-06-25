import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { LineTextDividerComponent } from '../../components/themed/LineTextDivider'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('LineTextDivider', () => {
  it('should render with loading props', () => {
    const fakeChild: React.ReactNode = 'hello'

    const rendered = render(
      <FakeProviders>
        <LineTextDividerComponent title="string" lowerCased>
          {fakeChild}
        </LineTextDividerComponent>
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
