/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { HiddenMenuButtonsComponent as Request } from '../../components/themed/HiddenMenuButtons.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      rightSwipable: {
        label: 'string',
        children: 'string',
        color: 'success',
        onPress: async () => undefined
      },
      leftSwipable: {
        label: 'string',
        children: 'string',
        color: 'success',
        onPress: async () => undefined
      },
      right: {
        label: 'string',
        children: 'string',
        color: 'success',
        onPress: async () => undefined
      },
      left: {
        label: 'string',
        children: 'string',
        color: 'success',
        onPress: async () => undefined
      },
      isSwipingRight: true,
      isSwipingLeft: true,
      swipeDirection: 'left',
      theme: getTheme()
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
