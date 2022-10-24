import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { BalanceBox } from '../../components/themed/WiredBalanceBox'

describe('BalanceBox', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <BalanceBox
        showBalance
        fiatAmount={11}
        defaultIsoFiat="string"
        exchangeRates={'GuiExchangeRates' as any}
        toggleAccountBalanceVisibility={() => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
