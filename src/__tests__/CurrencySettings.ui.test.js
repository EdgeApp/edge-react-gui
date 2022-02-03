// @flow
/* globals jest describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CurrencySettingsComponent } from '../components/scenes/CurrencySettingsScene.js'
import { edgeDark } from '../theme/variables/edgeDark.js'

describe('CurrencySettings', () => {
  it('should render', () => {
    const renderer = new ShallowRenderer()

    const currencyInfo: any = {
      currencyCode: 'BTG',
      defaultSettings: {},
      denominations: [
        { name: 'BTG', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTG', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' }
      ],
      pluginId: 'bitcoin-gold'
    }
    const account: any = {
      currencyConfig: {
        'bitcoin-gold': { currencyInfo }
      }
    }
    const route = {
      name: 'currencySettings',
      params: { currencyInfo }
    }

    const actual = renderer.render(
      <CurrencySettingsComponent
        account={account}
        currencyInfo={currencyInfo}
        route={route}
        selectDenomination={jest.fn()}
        selectedDenominationMultiplier="100"
        theme={edgeDark}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
