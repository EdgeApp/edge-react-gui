/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ClickableRowComponent } from '../../components/themed/ClickableRow.js'

describe('ClickableRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      onPress: () => undefined,
      onLongPress: () => undefined,
      highlight: 11,
      gradient: 11,
      autoHeight: 11,
      children: 'String',
      underline: 11,
      // eslint-disable-next-line react/no-unused-prop-types
      marginRem: 11,
      // eslint-disable-next-line react/no-unused-prop-types
      paddingRem: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<ClickableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
