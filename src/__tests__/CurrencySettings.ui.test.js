// @flow
/* globals jest describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CurrencySettingsComponent } from '../components/scenes/CurrencySettingsScene.js'
import { edgeDark } from '../theme/variables/edgeDark.js'

const typeHack: any = {}

describe('CurrencySettings', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()
    const props = {
      // NavigationProps:
      currencyInfo: typeHack,

      // StateProps:
      denominations: [
        { name: 'BTG', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTG', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' }
      ],
      selectedDenominationKey: '100',
      electrumServers: [],
      disableFetchingServers: false,
      defaultElectrumServer: '',

      // DispatchProps:
      disableCustomNodes: jest.fn(),
      enableCustomNodes: jest.fn(),
      saveCustomNodesList: jest.fn(),
      selectDenomination: jest.fn(),
      theme: edgeDark,
      currencyCode: 'BTG'
    }
    const actual = renderer.render(<CurrencySettingsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
