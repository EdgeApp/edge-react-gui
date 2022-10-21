import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { SceneHeaderComponent } from '../../components/themed/SceneHeader'

describe('SceneHeader', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeChild: React.ReactNode = 'hello'

    const actual = renderer.render(
      <SceneHeaderComponent title="string" underline withTopMargin>
        {fakeChild}
      </SceneHeaderComponent>
    )

    expect(actual).toMatchSnapshot()
  })
})
