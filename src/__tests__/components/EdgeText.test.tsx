import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { EdgeTextComponent } from '../../components/themed/EdgeText'

describe('EdgeText', () => {
  it('should render with some props', () => {
    const renderer = createRenderer()

    const props: any = {
      children: 'Hello world',
      ellipsizeMode: 'tail',
      numberOfLines: 2,
      style: {},
      disableFontScaling: false,
      theme: getTheme()
    }
    const actual = renderer.render(<EdgeTextComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
