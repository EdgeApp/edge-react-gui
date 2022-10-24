import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CardComponent } from '../../components/cards/Card'
import { getTheme } from '../../components/services/ThemeContext'

describe('Card', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeChild: React.ReactNode = 'string'

    const actual = renderer.render(
      <CardComponent warning marginRem={11} paddingRem={11} theme={getTheme()}>
        {fakeChild}
      </CardComponent>
    )

    expect(actual).toMatchSnapshot()
  })
})
