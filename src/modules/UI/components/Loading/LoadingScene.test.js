// @flow

/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { LoadingScene } from './LoadingScene.ui.js'

describe('LoadingScene', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()

    const props = {}
    const actual = renderer.render(<LoadingScene {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
