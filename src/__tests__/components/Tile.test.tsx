import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { TileComponent } from '../../components/tiles/Tile'

describe('Tile', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeChild: React.ReactNode = 11 as any

    const actual = renderer.render(
      <TileComponent body="string" error={false} onPress={() => undefined} title="string" type="copy" contentPadding maximumHeight="small" theme={getTheme()}>
        {fakeChild}
      </TileComponent>
    )

    expect(actual).toMatchSnapshot()
  })
})
