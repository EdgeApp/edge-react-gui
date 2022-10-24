import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ClickableRowComponent } from '../../components/themed/ClickableRow'

describe('ClickableRow', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeChild: React.ReactNode = 'String'

    const actual = renderer.render(
      <ClickableRowComponent
        onPress={() => undefined}
        onLongPress={() => undefined}
        highlight
        gradient
        autoHeight
        underline
        marginRem={11}
        paddingRem={11}
        theme={getTheme()}
      >
        {fakeChild}
      </ClickableRowComponent>
    )

    expect(actual).toMatchSnapshot()
  })
})
