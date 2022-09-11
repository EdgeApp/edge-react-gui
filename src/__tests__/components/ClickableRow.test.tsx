/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ClickableRowComponent } from '../../components/themed/ClickableRow'

describe('ClickableRow', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      onPress: () => undefined,
      onLongPress: () => undefined,
      highlight: 11,
      gradient: 11,
      autoHeight: 11,
      children: 'String',
      underline: 11,
      marginRem: 11,
      paddingRem: 11,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<ClickableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
