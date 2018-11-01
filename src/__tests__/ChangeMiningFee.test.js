/* globals jest describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import ChangeMiningFees from '../components/scenes/ChangeMiningFeeScene.js'

describe('Change Mining Fees', () => {
  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      feeSetting: 'standard',
      onSubmit: jest.fn(),
      sourceWallet: {}
    }
    const actual = renderer.render(<ChangeMiningFees {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with high props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      feeSetting: 'high',
      onSubmit: jest.fn(),
      sourceWallet: {}
    }
    const actual = renderer.render(<ChangeMiningFees {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with low props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      feeSetting: 'low',
      onSubmit: jest.fn(),
      sourceWallet: {}
    }
    const actual = renderer.render(<ChangeMiningFees {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with custom props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      feeSetting: 'custom',
      onSubmit: jest.fn(),
      sourceWallet: {}
    }
    const actual = renderer.render(<ChangeMiningFees {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
