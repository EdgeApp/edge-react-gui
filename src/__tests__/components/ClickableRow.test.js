// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ClickableRowComponent } from '../../components/themed/ClickableRow.js'

describe('ClickableRow', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
    const actual = renderer.render(<ClickableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
