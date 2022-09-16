import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CardComponent } from '../../components/cards/Card'
import { getTheme } from '../../components/services/ThemeContext'

describe('Card', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      children: 'string',
      warning: true,
      marginRem: 11,
      paddingRem: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<CardComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
