import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { WalletListSortableRowComponent } from '../../components/themed/WalletListSortableRow'

describe('WalletListSortableRow', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <WalletListSortableRowComponent
        exchangeRates={'GuiExchangeRates' as any}
        showBalance
        walletFiatSymbol="USD"
        exchangeDenomination={{
          multiplier: '100000000',
          name: 'BTC'
        }}
        getDisplayDenomination={(pluginId, currencyCode) => ({
          multiplier: '100000000',
          name: 'BTC'
        })}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
