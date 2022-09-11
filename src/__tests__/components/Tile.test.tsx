/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { TileComponent } from '../../components/tiles/Tile'

describe('Tile', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

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
