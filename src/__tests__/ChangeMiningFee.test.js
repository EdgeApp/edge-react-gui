/* globals jest describe it expect */
// @flow

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { ChangeMiningFee } from '../components/scenes/ChangeMiningFeeScene.js'

describe('Change Mining Fees', () => {
  const onSubmit = jest.fn()
  const wallet: Object = {
    currencyInfo: {
      defaultSettings: {
        customFeeSettings: ['satPerByte']
      }
    }
  }
  const typeHack: any = {}
  const commonProps = {
    onSubmit,
    maxSpendSet: false,
    route: {
      name: 'changeMiningFee',
      params: { wallet }
    },
    navigation: typeHack
  }

  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFee {...commonProps} networkFeeOption="standard" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with high props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFee {...commonProps} networkFeeOption="high" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with low props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFee {...commonProps} networkFeeOption="low" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with custom props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFee {...commonProps} networkFeeOption="custom" />
    expect(renderer.render(element)).toMatchSnapshot()
  })
})
