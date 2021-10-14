/* globals jest describe it expect */
// @flow

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { ChangeMiningFeeComponent } from '../components/scenes/ChangeMiningFeeScene.js'
import { getTheme } from '../components/services/ThemeContext.js'
import { fakeNavigation } from '../util/fake/fakeNavigation.js'

describe('Change Mining Fees', () => {
  const onSubmit = jest.fn()
  const wallet: Object = {
    currencyInfo: {
      defaultSettings: {
        customFeeSettings: ['satPerByte']
      }
    }
  }
  const guiMakeSpendInfo = {
    publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
    legacyAddress: '123412341234',
    nativeAmount: '100000',
    currencyCode: 'BCH',
    metadata: {}
  }
  const commonProps = {
    navigation: fakeNavigation,
    route: {
      name: 'changeMiningFee',
      params: { wallet, guiMakeSpendInfo, maxSpendSet: false, onSubmit }
    },
    theme: getTheme()
  }

  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFeeComponent {...commonProps} networkFeeOption="standard" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with high props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFeeComponent {...commonProps} networkFeeOption="high" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with low props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFeeComponent {...commonProps} networkFeeOption="low" />
    expect(renderer.render(element)).toMatchSnapshot()
  })

  it('should render with custom props', () => {
    const renderer = new ShallowRenderer()
    const element = <ChangeMiningFeeComponent {...commonProps} networkFeeOption="custom" />
    expect(renderer.render(element)).toMatchSnapshot()
  })
})
