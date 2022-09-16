import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { SceneHeaderComponent } from '../../components/themed/SceneHeader'

describe('SceneHeader', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      title: 'string',
      children: 'hello',
      underline: true,
      withTopMargin: true,
      theme: getTheme()
    }
    const actual = renderer.render(<SceneHeaderComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
