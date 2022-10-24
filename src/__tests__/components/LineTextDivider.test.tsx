import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { LineTextDividerComponent } from '../../components/themed/LineTextDivider'

describe('LineTextDivider', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeChild: React.ReactNode = 'hello'

    const actual = renderer.render(
      <LineTextDividerComponent title="string" lowerCased>
        {fakeChild}
      </LineTextDividerComponent>
    )

    expect(actual).toMatchSnapshot()
  })
})
