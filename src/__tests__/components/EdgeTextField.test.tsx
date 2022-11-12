import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { EdgeTextFieldComponent } from '../../components/themed/EdgeTextField'

describe('EdgeTextField', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<EdgeTextFieldComponent marginRem={11} theme={getTheme()} />)

    expect(actual).toMatchSnapshot()
  })
})
