/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { BalanceBox } from '../../components/themed/WiredBalanceBox'

describe('BalanceBox', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      showBalance: true,
      fiatAmount: 11,
      defaultIsoFiat: 'string',
      exchangeRates: 'GuiExchangeRates',
      toggleAccountBalanceVisibility: () => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<BalanceBox {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
