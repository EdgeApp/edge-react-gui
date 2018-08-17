/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import QRCode from './QRCode.ui.js'

describe('QRCode', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()
    const actual = renderer.render(<QRCode />)

    expect(actual).toMatchSnapshot()
  })
})
