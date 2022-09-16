import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { TileComponent } from '../../components/tiles/Tile'

describe('Tile', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      body: 'string',
      children: 11,
      error: false,
      onPress: () => undefined,
      title: 'string',
      type: 'copy',
      contentPadding: true,
      maximumHeight: 'small',
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<TileComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
