/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { OnBoardingComponent } from '../components/scenes/OnBoardingScene.js'

describe('On-Boarding Component', () => {
  it('should render without props', () => {
    const renderer = new ShallowRenderer()
    const actual = renderer.render(<OnBoardingComponent />)
    expect(actual).toMatchSnapshot()
  })
})
