// @flow
/* globals jest describe it expect */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import CurrencySettings from './CurrencySettings.ui'

describe('CurrencySettings', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()
    const props = {
      denominations: [
        { name: 'BTG', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTG', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' }
      ],
      logo: 'THIS IS A LOGO',
      selectDenomination: jest.fn(),
      selectedDenominationKey: '100',
      isCustomNodesEnabled: false,
      customNodesList: [],
      saveCustomNodesList: jest.fn(),
      isSetCustomNodesModalVisible: false,
      setCustomNodesModalVisibility: jest.fn(),
      enableCustomNodes: jest.fn(),
      disableCustomNodes: jest.fn()
    }
    const actual = renderer.render(<CurrencySettings {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
