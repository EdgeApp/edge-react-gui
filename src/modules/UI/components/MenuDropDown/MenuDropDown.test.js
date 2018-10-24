/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { MenuDropDownStyle } from '../../../../styles/components/HeaderMenuDropDownStyles.js'
import { MenuDropDown } from './MenuDropDown.ui.js'

describe('MenuDropDown component', () => {
  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      data: [
        {
          key: 'Key1',
          value: 'Value1',
          label: 'Label1'
        }
      ],
      style: {
        ...MenuDropDownStyle
      }
    }
    const actual = renderer.render(<MenuDropDown {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
